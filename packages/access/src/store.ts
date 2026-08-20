/*
 * The store this package needs, and nothing about how one is built.
 *
 * Everything here is an interface over rows. There is no Drizzle in this file
 * and no Postgres, which is the point: `@sushindustries/access` decides what a
 * scope is worth, when a link has expired and which of four refusals a caller
 * gets, and none of those are questions a database answers. Handing it a store
 * rather than a connection is what lets somebody install this package for its
 * token policy without also adopting my schema, my ORM and my migrations.
 *
 * The methods are shaped by the guarantees rather than by the tables. Two of
 * them - `claimInvite` and `revokeToken` - must be a single conditional write
 * each, because the atomicity is the feature: an implementation that reads and
 * then writes will pass every test written by one person clicking once, and
 * lose a token to a double-click in production. That requirement is stated on
 * each method rather than left in a README, because the README is not what
 * somebody writing a second adapter is reading.
 *
 * The row types are declared here rather than imported so that this package
 * compiles alone. They are structural, so a Drizzle `$inferSelect` satisfies
 * one without either side importing the other - the adapter in
 * `@sushindustries/db` is checked against these shapes where an application
 * passes it in, which is the one place both halves are visible at once.
 */

/** How an account came to exist. What proved the identity behind it. */
export type AccountSource = "owner" | "github" | "magic-link";

/** One person or agent that has authenticated, as this package reads it. */
export interface AccountRow {
	readonly id: string;
	readonly email: string | null;
	readonly githubLogin: string | null;
	readonly label: string | null;
	readonly source: AccountSource;
	readonly blockedAt: Date | null;
}

/** One minted credential, as stored. The hash, never the secret. */
export interface TokenRow {
	readonly id: string;
	readonly accountId: string;
	readonly name: string;
	readonly prefix: string;
	readonly scopes: string;
	readonly createdAt: Date;
	readonly expiresAt: Date | null;
	readonly lastUsedAt: Date | null;
	readonly revokedAt: Date | null;
}

/** One invitation, as stored. */
export interface InviteRow {
	readonly id: string;
	readonly email: string;
	readonly prefix: string;
	readonly tokenName: string;
	readonly scopes: string;
	readonly tokenDays: number | null;
	readonly createdAt: Date;
	readonly expiresAt: Date;
	readonly redeemedAt: Date | null;
	readonly tokenId: string | null;
	readonly revokedAt: Date | null;
}

/** A token and the account holding it. Always read together, never apart. */
export interface HeldToken {
	readonly token: TokenRow;
	readonly account: AccountRow;
}

/** What `insertToken` is given. The hash arrives hashed; this never hashes. */
export interface TokenInsert {
	readonly accountId: string;
	readonly name: string;
	readonly prefix: string;
	readonly hash: string;
	readonly scopes: string;
	readonly expiresAt: Date | null;
}

/** What `insertInvite` is given. */
export interface InviteInsert {
	readonly email: string;
	readonly hash: string;
	readonly prefix: string;
	readonly tokenName: string;
	readonly scopes: string;
	readonly tokenDays: number | null;
	readonly invitedBy: string | null;
	readonly expiresAt: Date;
}

/**
 * Everywhere this package touches storage.
 *
 * Fifteen methods, and the count is the useful number: it is small enough that
 * a second adapter is an afternoon, and it is the whole surface, so there is no
 * path by which a query appears somewhere else later.
 */
export interface AccessStore {
	/**
	 * Runs the body with every write inside one transaction.
	 *
	 * The store handed to the body must be the transactional one, and the body
	 * must use it rather than the outer store - which is why it is passed in
	 * rather than left to be closed over. An adapter that ignores the argument
	 * and runs the body against the outer connection will pass every test and
	 * roll nothing back.
	 *
	 * Used by exactly one caller: `redeem`, which claims a link and mints a
	 * token and must not do the first without the second. Everything else here
	 * is a single statement and needs no help.
	 *
	 * An adapter with no transactions can implement this as `body(this)` and be
	 * honest about what it does not offer, because the single-use guarantee
	 * does not live here - it lives in `claimInvite`, which is atomic on its
	 * own. What this adds is that a crash between the claim and the mint does
	 * not spend a link for nothing.
	 */
	transaction<T>(body: (store: AccessStore) => Promise<T>): Promise<T>;

	/**
	 * The account this login owns, created on first sight.
	 *
	 * Must be find-or-create and must survive two simultaneous sign-ins racing
	 * into it - an insert that ignores a conflict on the login, then a read.
	 * Read-then-insert produces two rows for the same person under concurrency.
	 */
	accountByLogin(login: string, source: AccountSource): Promise<AccountRow>;

	/**
	 * The same, against the address. Created when the address is first proven.
	 *
	 * The address arrives already trimmed and lower-cased - `accountForEmail`
	 * does that before calling this, so an adapter must not normalise again and
	 * must not skip it either. Both halves doing it is harmless; neither doing
	 * it puts two rows in a table whose unique index was meant to prevent that.
	 */
	accountByEmail(email: string, source: AccountSource): Promise<AccountRow>;

	/**
	 * Writes one token and returns it.
	 *
	 * A unique violation on the hash must propagate rather than be retried.
	 * Two 256-bit secrets colliding is a broken random source, and a quiet
	 * second attempt hides the only symptom that would ever report it.
	 */
	insertToken(values: TokenInsert): Promise<TokenRow | undefined>;

	/** Every token with its account, newest first. */
	tokens(): Promise<readonly HeldToken[]>;

	/**
	 * Marks one revoked, if it is not already.
	 *
	 * Conditional on `revokedAt` being null, so revoking twice does not move the
	 * timestamp. The interesting number is when it was first taken away.
	 */
	revokeToken(id: string, at: Date): Promise<void>;

	/** One token with its account, by id, whatever state it is in. */
	tokenById(id: string): Promise<HeldToken | null>;

	/**
	 * One token by hash, only if it is usable at all.
	 *
	 * Must exclude revoked tokens and blocked accounts *in the query*. A row
	 * that fails either must never become a value the caller is holding, so
	 * there is no path on which one of the two checks is forgotten. Expiry and
	 * scope are the caller's to check, because they are a different refusal.
	 */
	liveTokenByHash(hash: string): Promise<HeldToken | null>;

	/**
	 * Records that a token was just used. Bookkeeping, not part of an answer.
	 *
	 * Called without being awaited and must never reject. Whether this landed
	 * has no bearing on whether a request may proceed, and a gate that waits on
	 * a write turns a read-path failure into a locked door.
	 */
	touchToken(id: string, at: Date): void;

	/** Writes one invitation and returns it. */
	insertInvite(values: InviteInsert): Promise<InviteRow | undefined>;

	/** Every invitation, newest first. */
	invites(): Promise<readonly InviteRow[]>;

	/**
	 * Withdraws one that has not been collected.
	 *
	 * Conditional on both `redeemedAt` and `revokedAt` being null, so
	 * withdrawing something already collected is a no-op rather than a row that
	 * reads as both.
	 */
	withdrawInvite(id: string, at: Date): Promise<void>;

	/** One invitation by id, whatever state it is in. */
	inviteById(id: string): Promise<InviteRow | null>;

	/**
	 * One invitation by hash, if it is unspent - and without spending it.
	 *
	 * This is what a preview reads. Expiry is the caller's to check here, so
	 * that a link which has only just lapsed can be told apart from one that
	 * was never real.
	 */
	liveInviteByHash(hash: string): Promise<InviteRow | null>;

	/**
	 * Spends one invitation, atomically, and reports whether this caller won.
	 *
	 * The single-use guarantee lives in this method and nowhere else. It must be
	 * one `UPDATE ... WHERE hash = ? AND redeemed_at IS NULL AND revoked_at IS
	 * NULL AND expires_at > now() RETURNING`, so that a double-click, a retried
	 * request and a mail scanner racing the recipient produce one winner and one
	 * token. Returning null means somebody else already had it.
	 */
	claimInvite(hash: string, at: Date): Promise<InviteRow | null>;

	/**
	 * Records what an invitation produced. Best-effort, and must not reject.
	 *
	 * Written after the token exists. Losing this costs a join in a listing;
	 * throwing would tell somebody their collection failed while a live token
	 * sat in the table.
	 */
	linkInviteToken(inviteId: string, tokenId: string): Promise<void>;
}
