import type { AccessStore } from "@sushindustries/access";
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
	type MagicLink,
	magicLinks,
	sql,
} from "@sushindustries/db/schema";

/*
 * The Drizzle half of `@sushindustries/access`, and the seam between them.
 *
 * `@sushindustries/access` owns the policy - what a scope is worth, when a link
 * has lapsed, which of four refusals a caller gets - and declares the storage
 * it needs as `AccessStore`. Neither that package nor `@sushindustries/db`
 * imports the other, which is what keeps `access` installable without adopting
 * this schema and `db` free of any access-shaped surface. Joining them is an
 * application's job, and this is where this application does it.
 *
 * That it lives here rather than in either package is the whole reason the
 * port can be implemented against without being restated: this file imports
 * `AccessStore` and is checked against it directly, so a method the port grows
 * is a type error here rather than a drift nobody notices.
 *
 * Every conditional write the port asks for is one statement. That is the part
 * worth reviewing: `claimInvite` is the single-use guarantee, and an
 * implementation that reads before it writes passes every test written by one
 * person clicking once.
 */

/**
 * Whichever connection this store is bound to.
 *
 * A function rather than a value so that one builder serves both cases: the
 * ordinary store resolves `getDb()` on each call and stays lazy, and the one
 * handed to a transaction body resolves the `tx` handle instead. Everything
 * below goes through it, which is what makes it impossible for a statement to
 * escape a transaction by reaching for the outer connection.
 */
type Db = ReturnType<typeof getDb>;

/** The handle inside a transaction body. Shares the query builder with `Db`. */
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type Handle = () => Db | Tx;

function storeOn(db: Handle): AccessStore {
	/** A token is never read without the account holding it. One join, one shape. */
	const held = () =>
		db()
			.select({ token: apiTokens, account: accounts })
			.from(apiTokens)
			.innerJoin(accounts, eq(apiTokens.accountId, accounts.id));

	return {
		/**
		 * One transaction, and the body runs against it.
		 *
		 * The store passed to the body is built on `tx`, so a caller that uses
		 * the argument cannot escape the transaction and a caller that ignores
		 * it is the only way to. Nested calls reuse the handle they were given
		 * rather than opening a second transaction.
		 */
		async transaction<T>(body: (store: AccessStore) => Promise<T>): Promise<T> {
			return await db().transaction(
				async (tx) => await body(storeOn(() => tx)),
			);
		},

		async accountByLogin(
			login: string,
			source: AccountSource,
		): Promise<Account> {
			/*
			 * `on conflict do nothing` then read, so two simultaneous sign-ins race
			 * into the same row rather than two. Correct under concurrency without
			 * holding a lock, which a read-then-insert is not.
			 */
			await db()
				.insert(accounts)
				.values({ githubLogin: login, label: login, source })
				.onConflictDoNothing({ target: accounts.githubLogin });

			const [found] = await db()
				.select()
				.from(accounts)
				.where(eq(accounts.githubLogin, login))
				.limit(1);

			if (!found) {
				throw new Error(`No account for ${login}, and none was created.`);
			}

			return found;
		},

		async accountByEmail(
			email: string,
			source: AccountSource,
		): Promise<Account> {
			await db()
				.insert(accounts)
				.values({ email, label: email, source })
				.onConflictDoNothing({ target: accounts.email });

			const [found] = await db()
				.select()
				.from(accounts)
				.where(eq(accounts.email, email))
				.limit(1);

			if (!found) {
				throw new Error(`No account for ${email}, and none was created.`);
			}

			return found;
		},

		/** The unique violation on the hash is left to propagate. See the port. */
		async insertToken(values: {
			accountId: string;
			name: string;
			prefix: string;
			hash: string;
			scopes: string;
			expiresAt: Date | null;
		}): Promise<ApiToken | undefined> {
			const [row] = await getDb().insert(apiTokens).values(values).returning();
			return row;
		},

		async tokens(): Promise<readonly { token: ApiToken; account: Account }[]> {
			return await held().orderBy(desc(apiTokens.createdAt));
		},

		/** Conditional, so revoking twice does not move the timestamp. */
		async revokeToken(id: string, at: Date): Promise<void> {
			await db()
				.update(apiTokens)
				.set({ revokedAt: at })
				.where(and(eq(apiTokens.id, id), isNull(apiTokens.revokedAt)));
		},

		async tokenById(
			id: string,
		): Promise<{ token: ApiToken; account: Account } | null> {
			const [row] = await held().where(eq(apiTokens.id, id)).limit(1);
			return row ?? null;
		},

		/** Revoked tokens and blocked accounts are excluded in the statement. */
		async liveTokenByHash(
			hash: string,
		): Promise<{ token: ApiToken; account: Account } | null> {
			const [row] = await held()
				.where(
					and(
						eq(apiTokens.hash, hash),
						isNull(apiTokens.revokedAt),
						isNull(accounts.blockedAt),
					),
				)
				.limit(1);

			return row ?? null;
		},

		/** Never awaited by the caller, so it swallows its own failure. */
		touchToken(id: string, at: Date): void {
			void db()
				.update(apiTokens)
				.set({ lastUsedAt: at })
				.where(eq(apiTokens.id, id))
				.catch(() => {});
		},

		async insertInvite(values: {
			email: string;
			hash: string;
			prefix: string;
			tokenName: string;
			scopes: string;
			tokenDays: number | null;
			invitedBy: string | null;
			expiresAt: Date;
		}): Promise<MagicLink | undefined> {
			const [row] = await getDb().insert(magicLinks).values(values).returning();
			return row;
		},

		async invites(): Promise<readonly MagicLink[]> {
			return await db()
				.select()
				.from(magicLinks)
				.orderBy(desc(magicLinks.createdAt));
		},

		/** Conditional on unredeemed and unwithdrawn, so it cannot read as both. */
		async withdrawInvite(id: string, at: Date): Promise<void> {
			await db()
				.update(magicLinks)
				.set({ revokedAt: at })
				.where(
					and(
						eq(magicLinks.id, id),
						isNull(magicLinks.redeemedAt),
						isNull(magicLinks.revokedAt),
					),
				);
		},

		async inviteById(id: string): Promise<MagicLink | null> {
			const [row] = await db()
				.select()
				.from(magicLinks)
				.where(eq(magicLinks.id, id))
				.limit(1);

			return row ?? null;
		},

		/** Reads without spending. Expiry is the caller's to judge. */
		async liveInviteByHash(hash: string): Promise<MagicLink | null> {
			const [row] = await db()
				.select()
				.from(magicLinks)
				.where(
					and(
						eq(magicLinks.hash, hash),
						isNull(magicLinks.redeemedAt),
						isNull(magicLinks.revokedAt),
					),
				)
				.limit(1);

			return row ?? null;
		},

		/**
		 * The single-use guarantee, in one statement.
		 *
		 * `UPDATE ... WHERE redeemed_at IS NULL ... RETURNING` claims the row and
		 * reports whether this caller was the one that claimed it, atomically. The
		 * expiry is inside the same WHERE for the same reason: checked in the
		 * statement that claims, not in an `if` standing beside it.
		 */
		async claimInvite(hash: string, at: Date): Promise<MagicLink | null> {
			const [claimed] = await db()
				.update(magicLinks)
				.set({ redeemedAt: at })
				.where(
					and(
						eq(magicLinks.hash, hash),
						isNull(magicLinks.redeemedAt),
						isNull(magicLinks.revokedAt),
						sql`${magicLinks.expiresAt} > now()`,
					),
				)
				.returning();

			return claimed ?? null;
		},

		/** Best-effort. Losing this costs a join; throwing would cost a token. */
		async linkInviteToken(inviteId: string, tokenId: string): Promise<void> {
			await db()
				.update(magicLinks)
				.set({ tokenId })
				.where(eq(magicLinks.id, inviteId))
				.catch(() => {});
		},
	};
}

/** The store `@sushindustries/access` runs on here. */
export function accessStore(): AccessStore {
	return storeOn(() => getDb());
}
