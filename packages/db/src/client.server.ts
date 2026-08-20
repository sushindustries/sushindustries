import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
/*
 * The `.ts` extension is required, not stylistic.
 *
 * This package's `exports` point at `src`, so a bundler transpiles these and
 * plain Node type-strips them. Node's stripping does not resolve extensionless
 * relative specifiers, so `./schema` loads under Vite and fails under `node` -
 * which is how the CLI could import `db/schema` for years and could not import
 * this file at all. TypeScript accepts the extension here; nothing is lost.
 */
import * as schema from "./schema.ts";
import { pageFeedback } from "./schema.ts";

/*
 * The database client. Server-only, twice over: the `.server.ts` suffix is in
 * TanStack Start's default client deny list, and this file is the only place
 * that reads DATABASE_URL.
 *
 * The connection is created lazily rather than at module scope. Railway
 * injects DATABASE_URL at runtime, not at build time, so a module-scope
 * connection would be constructed during the build with an undefined URL and
 * fail the whole deploy rather than the one route that needs a database.
 */

let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
	if (client) return client;

	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL is not set. Add a Postgres service in Railway, or set it in .env for local development.",
		);
	}

	client = drizzle(postgres(url, { prepare: false }), { schema });
	return client;
}

/**
 * Every vote already cast on one page. Bounded by construction - a doc page
 * accumulates tens of votes over its life, not the whole table - because the
 * caller always scopes this to one page rather than reading everything.
 */
export function getPageVotes(
	page: string,
): Promise<Array<typeof schema.pageFeedback.$inferSelect>> {
	return getDb().select().from(pageFeedback).where(eq(pageFeedback.page, page));
}

/**
 * Records a vote and reports the transaction that recorded it.
 *
 * The transaction id is the whole reason this is a function rather than an
 * `insert` at the call site. Electric streams rows out of the Postgres
 * replication log, so a client that has just written one is racing its own
 * write back to itself: TanStack DB holds the optimistic row until it sees
 * the sync catch up, and `txid` is what it matches on. Without it the
 * optimistic row is dropped the moment the write resolves and reappears a
 * beat later when the stream delivers it, which reads as a vote flickering
 * off and on.
 *
 * `pg_current_xact_id()` has to be read inside the same transaction as the
 * insert, which is why both are in one `db.transaction`. Read outside it, the
 * number belongs to a different transaction than the row and matches nothing.
 *
 * A number, because that is what TanStack DB's matching contract takes. The
 * underlying value is `xid8` and therefore 64-bit, so this is exact only up
 * to 2^53 transactions on one database - about nine quadrillion, and a
 * counter this one will not reach. Narrowed here rather than at the call
 * site so there is one place to change if it ever needs to be a string.
 */
export async function recordPageVote(
	vote: schema.NewPageFeedback,
): Promise<{ txid: number }> {
	return getDb().transaction(async (tx) => {
		await tx.insert(pageFeedback).values(vote);

		const [row] = await tx.execute<{ txid: string }>(
			sql`select pg_current_xact_id()::text as txid`,
		);

		if (!row) throw new Error("No transaction id came back with the vote.");

		return { txid: Number(row.txid) };
	});
}
