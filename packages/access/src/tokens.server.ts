import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
	type Bearer,
	joinScopes,
	type MintedToken,
	type MintRequest,
	PREFIX_LENGTH,
	type Scope,
	splitScopes,
	TOKEN_PREFIX,
	type TokenState,
	type TokenSummary,
} from "./index.ts";
import type {
	AccessStore,
	AccountRow,
	AccountSource,
	TokenRow,
} from "./store.ts";

/*
 * Minting, verifying and revoking credentials.
 *
 * The half of this package that holds secrets, so the half with the
 * `.server.ts` suffix - which is in TanStack Start's client deny list, making
 * the boundary something the build enforces rather than something a reviewer
 * notices.
 *
 * What is deliberately absent: the plaintext token, after the moment it is
 * returned. `mint()` is the only function here that has ever seen one, and it
 * hands it back exactly once. Everything downstream - the table, the listings,
 * the logs - holds a SHA-256 and eleven characters of prefix.
 *
 * Also absent: any idea of where the rows live. The functions that touch
 * storage are behind `tokens(store)`; the four above it are pure and stay
 * loose, because a caller that needs `bearerFrom` on a request has no store to
 * hand over and should not have to invent one.
 */

const hashOf = (secret: string) =>
	createHash("sha256").update(secret).digest("hex");

/**
 * Whether two strings match, without letting the clock say how nearly.
 *
 * Exported because the caller usually has a second secret to compare - a
 * shared key from the environment, say - and a second implementation of this
 * is how one of them ends up using `===`.
 */
export function sameSecret(offered: string, expected: string): boolean {
	const a = Buffer.from(offered);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/** The bearer token on a request, or null. Header form only, per RFC 6750. */
export function bearerFrom(request: Request): string | null {
	const header = request.headers.get("authorization");
	if (!header) return null;

	const [scheme, ...rest] = header.split(/\s+/);
	if (scheme?.toLowerCase() !== "bearer") return null;

	return rest.join(" ").trim() || null;
}

/**
 * A new secret: the prefix, then 32 bytes of randomness.
 *
 * `randomBytes` rather than `randomUUID`. A UUID v4 is 122 bits with six of
 * them spent announcing that it is a UUID, and it is formatted for a database
 * key rather than for something a person pastes into a shell.
 */
export function newSecret(prefix: string): string {
	return `${prefix}${randomBytes(32).toString("base64url")}`;
}

function stateOf(row: TokenRow, blocked: boolean): TokenState {
	if (row.revokedAt || blocked) return "revoked";
	if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return "expired";
	return "active";
}

/** How a person recognises an account in a list: their email, login, or id. */
const nameOf = (account: AccountRow) =>
	account.email ?? account.githubLogin ?? account.id;

function summarise(row: TokenRow, account: AccountRow): TokenSummary {
	return {
		id: row.id,
		name: row.name,
		prefix: row.prefix,
		scopes: splitScopes(row.scopes),
		createdAt: row.createdAt.toISOString(),
		expiresAt: row.expiresAt?.toISOString() ?? null,
		lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
		revokedAt: row.revokedAt?.toISOString() ?? null,
		holder: nameOf(account),
		state: stateOf(row, Boolean(account.blockedAt)),
	};
}

/** Everything the token half does, bound to one store. */
export interface Tokens {
	accountForLogin(login: string, source?: AccountSource): Promise<AccountRow>;
	accountForEmail(email: string, source?: AccountSource): Promise<AccountRow>;
	mint(request: MintRequest, account: AccountRow): Promise<MintedToken>;
	list(): Promise<readonly TokenSummary[]>;
	revoke(id: string): Promise<TokenSummary | null>;
	verify(secret: string, scope: Scope): Promise<Bearer | null>;
}

/**
 * Binds the token operations to a store.
 *
 * A factory rather than a store argument on each function, because every
 * caller here uses three or four of them against the same store and threading
 * it through each call is how one of them ends up against a different one.
 */
export function tokens(store: AccessStore): Tokens {
	/**
	 * The account a login owns, created on first sight.
	 *
	 * Find-or-create rather than a migration that seeds one, because the first
	 * account is not a fact about the schema - it is a fact about whoever signed
	 * in, and in a fresh database that is nobody yet. This is what lets an
	 * application mint a token against an empty table with no seeding step.
	 */
	const accountForLogin = (login: string, source: AccountSource = "github") =>
		store.accountByLogin(login, source);

	/**
	 * The account an address owns, created on first proof of it.
	 *
	 * The same find-or-create against the other unique column. Two functions
	 * rather than one taking a field name, because the field is not a parameter
	 * of the idea: an account keyed on a login was identified by an identity
	 * provider, and one keyed on an email proved that address by receiving
	 * something at it. A single function with a `by` argument would let a caller
	 * write the wrong one without noticing.
	 */
	const accountForEmail = (
		email: string,
		source: AccountSource = "magic-link",
	) => store.accountByEmail(email.trim().toLowerCase(), source);

	/**
	 * Mints one, and returns the secret for the only time it will be available.
	 *
	 * The insert can fail on the unique hash, and that failure is left to
	 * propagate rather than retried. Two 256-bit secrets colliding is not a
	 * collision, it is a broken random source, and quietly minting a second one
	 * would hide the only symptom that would ever say so.
	 */
	async function mint(
		request: MintRequest,
		account: AccountRow,
	): Promise<MintedToken> {
		const secret = newSecret(TOKEN_PREFIX);

		const expiresAt =
			request.expiresInDays === null
				? null
				: new Date(Date.now() + request.expiresInDays * 24 * 60 * 60 * 1000);

		const row = await store.insertToken({
			accountId: account.id,
			name: request.name,
			prefix: secret.slice(0, PREFIX_LENGTH),
			hash: hashOf(secret),
			scopes: joinScopes(request.scopes),
			expiresAt,
		});

		if (!row) throw new Error("The token was not written.");

		return { token: secret, summary: summarise(row, account) };
	}

	/** Every token, newest first, with the account each belongs to. */
	async function list(): Promise<readonly TokenSummary[]> {
		const held = await store.tokens();
		return held.map(({ token, account }) => summarise(token, account));
	}

	/** Revokes one. Idempotent, and it says what the token became. */
	async function revoke(id: string): Promise<TokenSummary | null> {
		await store.revokeToken(id, new Date());

		const held = await store.tokenById(id);
		return held ? summarise(held.token, held.account) : null;
	}

	/**
	 * Whether this secret opens this scope, right now.
	 *
	 * Four reasons to refuse, and three of them are in one query: no such hash,
	 * revoked, account blocked. The store is required to check those in the
	 * statement rather than in three `if`s afterwards - not for speed, but so
	 * that a row failing any of them never becomes a value this function is
	 * holding, and there is no path where one of the checks is forgotten.
	 *
	 * Expiry and scope are checked here, because both produce a different kind
	 * of refusal from "no such token" and a caller may want to distinguish them.
	 */
	async function verify(secret: string, scope: Scope): Promise<Bearer | null> {
		if (!secret.startsWith(TOKEN_PREFIX)) return null;

		const now = new Date();
		const held = await store.liveTokenByHash(hashOf(secret));

		if (!held) return null;
		if (held.token.expiresAt && held.token.expiresAt <= now) return null;

		const scopes = splitScopes(held.token.scopes);
		if (!scopes.includes(scope)) return null;

		// Deliberately not awaited. See `touchToken` on the store.
		store.touchToken(held.token.id, now);

		return {
			tokenId: held.token.id,
			accountId: held.account.id,
			scopes,
			holder: nameOf(held.account),
		};
	}

	return { accountForLogin, accountForEmail, mint, list, revoke, verify };
}
