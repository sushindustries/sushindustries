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
	type MintedToken,
	type MintTokenRequest,
	PREFIX_LENGTH,
	parseScopes,
	type Scope,
	TOKEN_PREFIX,
	type TokenSummary,
} from "./access.schemas";

/*
 * Minting, verifying and revoking the keys to this deployment.
 *
 * This is the half of the access domain that holds secrets, so it is the half
 * with the `.server.ts` suffix and no React in it. `/mcp`, `/graphql` and
 * `/studio/report` all end up in `verify()`; the studio panel ends up in the
 * other three functions through a server function. One implementation, because
 * a second one is how an endpoint ends up honouring a revocation the first one
 * enforces.
 *
 * What is deliberately not here: the plaintext token, after the moment it is
 * returned. `mint()` is the only function in this repository that has ever seen
 * one, and it hands it back exactly once. Everything downstream - the table,
 * the listing, the logs - holds a SHA-256 and eleven characters of prefix.
 */

const db = () => getDb();

const hashOf = (token: string) =>
	createHash("sha256").update(token).digest("hex");

/**
 * Whether two strings match, without letting the clock say how nearly.
 *
 * Only actually needed for the environment token: a minted token is looked up
 * by its own hash, so the comparison happens inside an index rather than in
 * this process. It is used for both anyway, because the day somebody adds a
 * third comparison is not the day to be remembering which kind it is.
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
function newSecret(): string {
	return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

/** Live, expired or revoked - decided once, here, rather than at each caller. */
function stateOf(row: ApiToken, blocked: boolean): TokenSummary["state"] {
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
		scopes: parseScopes(row.scopes),
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
 * Find-or-create rather than a migration that seeds one, because the owner's
 * account is not a fact about the schema - it is a fact about whoever signed
 * in, and in a fresh local database that is nobody yet. This is what lets the
 * studio mint a token on a laptop with an empty table.
 *
 * Keyed on `github_login`, which is unique, so two simultaneous sign-ins race
 * into the same row rather than two: the insert is `on conflict do nothing`
 * followed by a read, which is the shape that is correct under concurrency
 * without holding a lock.
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
 * Mints one, and returns the secret for the only time it will be available.
 *
 * The insert can fail on the unique hash, and that failure is left to
 * propagate rather than retried. Two 256-bit secrets colliding is not a
 * collision, it is a broken random source, and quietly minting a second one
 * would hide the only symptom that would ever tell me.
 */
export async function mint(
	request: MintTokenRequest,
	account: Account,
): Promise<MintedToken> {
	const secret = newSecret();

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
			scopes: request.scopes.join(" "),
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
 * Revokes one. Idempotent, and it says which it was.
 *
 * `where revoked_at is null` rather than an unconditional update, so revoking
 * twice does not move the timestamp - the interesting number is when it was
 * first taken away, and a second click should not be able to rewrite that.
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

/** What a verified request turns out to be holding. */
export interface Bearer {
	readonly tokenId: string;
	readonly accountId: string;
	readonly scopes: readonly Scope[];
	readonly holder: string;
}

/**
 * Whether this secret opens this scope, right now.
 *
 * Four reasons to refuse and they are all checked in one query: no such hash,
 * revoked, expired, account blocked. Checking them in the database rather than
 * in three `if`s afterwards is not about speed - it is that a row which does
 * not satisfy the conditions never becomes a value this function is holding,
 * so there is no path where one of the checks is forgotten.
 *
 * The scope check is the one exception, done here, because refusing a valid
 * token for the wrong scope is a different answer from refusing an invalid one
 * and the caller may want to say so.
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

	const scopes = parseScopes(row.token.scopes);
	if (!scopes.includes(scope)) return null;

	/*
	 * Bookkeeping, not part of the answer.
	 *
	 * Deliberately not awaited: whether the "last used" column landed has no
	 * bearing on whether this request may proceed, and making the gate wait on a
	 * write turns a read-path failure into a locked door. The catch is there
	 * because an unhandled rejection would take the process down for a column
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
