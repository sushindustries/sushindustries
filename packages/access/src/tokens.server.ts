import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@sushindustries/db/client";
import {
	type Account,
	type AccountSource,
	type ApiToken,
	accounts,
	and,
	apiTokens,
	desc,
	eq,
	isNull,
} from "@sushindustries/db/schema";
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
} from "./index";

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
 */

const db = () => getDb();

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

function stateOf(row: ApiToken, blocked: boolean): TokenState {
	if (row.revokedAt || blocked) return "revoked";
	if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return "expired";
	return "active";
}

/** How a person recognises an account in a list: their email, login, or id. */
const nameOf = (account: Account) =>
	account.email ?? account.githubLogin ?? account.id;

function summarise(row: ApiToken, account: Account): TokenSummary {
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

/**
 * The account a login owns, created on first sight.
 *
 * Find-or-create rather than a migration that seeds one, because the first
 * account is not a fact about the schema - it is a fact about whoever signed
 * in, and in a fresh database that is nobody yet. This is what lets an
 * application mint a token against an empty table with no seeding step.
 *
 * `on conflict do nothing` then read, so two simultaneous sign-ins race into
 * the same row rather than two. That is correct under concurrency without
 * holding a lock, which a read-then-insert is not.
 */
export async function accountForLogin(
	login: string,
	source: AccountSource = "github",
): Promise<Account> {
	await db()
		.insert(accounts)
		.values({ githubLogin: login, label: login, source })
		.onConflictDoNothing({ target: accounts.githubLogin });

	const [found] = await db()
		.select()
		.from(accounts)
		.where(eq(accounts.githubLogin, login))
		.limit(1);

	if (!found) throw new Error(`No account for ${login}, and none was created.`);

	return found;
}

/**
 * The account an address owns, created on first proof of it.
 *
 * The same find-or-create against the other unique column. Two functions
 * rather than one taking a field name, because the field is not a parameter of
 * the idea: an account keyed on a login was identified by an identity
 * provider, and one keyed on an email proved that address by receiving
 * something at it. A single function with a `by` argument would let a caller
 * write the wrong one without noticing.
 */
export async function accountForEmail(
	email: string,
	source: AccountSource = "magic-link",
): Promise<Account> {
	const address = email.trim().toLowerCase();

	await db()
		.insert(accounts)
		.values({ email: address, label: address, source })
		.onConflictDoNothing({ target: accounts.email });

	const [found] = await db()
		.select()
		.from(accounts)
		.where(eq(accounts.email, address))
		.limit(1);

	if (!found) {
		throw new Error(`No account for ${address}, and none was created.`);
	}

	return found;
}

/**
 * Mints one, and returns the secret for the only time it will be available.
 *
 * The insert can fail on the unique hash, and that failure is left to
 * propagate rather than retried. Two 256-bit secrets colliding is not a
 * collision, it is a broken random source, and quietly minting a second one
 * would hide the only symptom that would ever say so.
 */
export async function mint(
	request: MintRequest,
	account: Account,
): Promise<MintedToken> {
	const secret = newSecret(TOKEN_PREFIX);

	const expiresAt =
		request.expiresInDays === null
			? null
			: new Date(Date.now() + request.expiresInDays * 24 * 60 * 60 * 1000);

	const [row] = await db()
		.insert(apiTokens)
		.values({
			accountId: account.id,
			name: request.name,
			prefix: secret.slice(0, PREFIX_LENGTH),
			hash: hashOf(secret),
			scopes: joinScopes(request.scopes),
			expiresAt,
		})
		.returning();

	if (!row) throw new Error("The token was not written.");

	return { token: secret, summary: summarise(row, account) };
}

/** Every token, newest first, with the account each belongs to. */
export async function list(): Promise<readonly TokenSummary[]> {
	const rows = await db()
		.select({ token: apiTokens, account: accounts })
		.from(apiTokens)
		.innerJoin(accounts, eq(apiTokens.accountId, accounts.id))
		.orderBy(desc(apiTokens.createdAt));

	return rows.map(({ token, account }) => summarise(token, account));
}

/**
 * Revokes one. Idempotent, and it says what the token became.
 *
 * `where revoked_at is null` rather than an unconditional update, so revoking
 * twice does not move the timestamp - the interesting number is when it was
 * first taken away, and a second click must not rewrite that.
 */
export async function revoke(id: string): Promise<TokenSummary | null> {
	await db()
		.update(apiTokens)
		.set({ revokedAt: new Date() })
		.where(and(eq(apiTokens.id, id), isNull(apiTokens.revokedAt)));

	const [row] = await db()
		.select({ token: apiTokens, account: accounts })
		.from(apiTokens)
		.innerJoin(accounts, eq(apiTokens.accountId, accounts.id))
		.where(eq(apiTokens.id, id))
		.limit(1);

	return row ? summarise(row.token, row.account) : null;
}

/**
 * Whether this secret opens this scope, right now.
 *
 * Four reasons to refuse, and three of them are in one query: no such hash,
 * revoked, account blocked. Checking them in the database rather than in three
 * `if`s afterwards is not about speed - it is that a row failing any of them
 * never becomes a value this function is holding, so there is no path where
 * one of the checks is forgotten.
 *
 * Expiry and scope are checked here, because both produce a different kind of
 * refusal from "no such token" and a caller may want to distinguish them.
 */
export async function verify(
	secret: string,
	scope: Scope,
): Promise<Bearer | null> {
	if (!secret.startsWith(TOKEN_PREFIX)) return null;

	const now = new Date();

	const [row] = await db()
		.select({ token: apiTokens, account: accounts })
		.from(apiTokens)
		.innerJoin(accounts, eq(apiTokens.accountId, accounts.id))
		.where(
			and(
				eq(apiTokens.hash, hashOf(secret)),
				isNull(apiTokens.revokedAt),
				isNull(accounts.blockedAt),
			),
		)
		.limit(1);

	if (!row) return null;
	if (row.token.expiresAt && row.token.expiresAt <= now) return null;

	const scopes = splitScopes(row.token.scopes);
	if (!scopes.includes(scope)) return null;

	/*
	 * Bookkeeping, not part of the answer.
	 *
	 * Deliberately not awaited: whether the "last used" column landed has no
	 * bearing on whether this request may proceed, and making the gate wait on
	 * a write turns a read-path failure into a locked door. The catch is there
	 * because an unhandled rejection would take a process down for a column
	 * nobody reads in an emergency.
	 */
	void db()
		.update(apiTokens)
		.set({ lastUsedAt: now })
		.where(eq(apiTokens.id, row.token.id))
		.catch(() => {});

	return {
		tokenId: row.token.id,
		accountId: row.account.id,
		scopes,
		holder: nameOf(row.account),
	};
}
