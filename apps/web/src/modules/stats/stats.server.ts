import { getDb } from "@sushindustries/db/client";
import { eq, type PageKind, pageViews, sql } from "@sushindustries/db/schema";

/*
 * Read counts per page, and the rule that keeps them optional.
 *
 * **Every function here returns rather than throws when there is no database.**
 * That is the whole design. This site renders every page from Markdown inlined
 * at build time, so a counter is decoration - and a decoration that can take
 * down a page is a worse trade than a page with no counter on it.
 *
 * `getDb()` throws when `DATABASE_URL` is unset, which is the right behaviour
 * for a function whose job is to hand back a connection. Catching it here is
 * what turns "this deployment has no database" from an incident into a missing
 * number, and it is why local development needs no Postgres at all.
 *
 * `.server.ts` because it opens a socket and reads a secret. TanStack Start's
 * default import protection denies this suffix from the client bundle, so a
 * component that imports it fails the build rather than shipping a Postgres
 * driver to a browser.
 */

export interface PageStat {
	/** Route path, e.g. `/components/button`. */
	readonly path: string;
	readonly kind: PageKind;
	readonly views: number;
	/** When this path was first opened by anybody. */
	readonly firstSeen: string;
	readonly lastSeen: string;
}

function toStat(row: typeof pageViews.$inferSelect): PageStat {
	return {
		path: row.path,
		kind: row.kind,
		views: row.views,
		firstSeen: row.firstSeen.toISOString(),
		lastSeen: row.lastSeen.toISOString(),
	};
}

/** Every counted page, or nothing at all if there is no database to ask. */
export async function readAllViews(): Promise<PageStat[] | null> {
	try {
		const rows = await getDb().select().from(pageViews);
		return rows.map(toStat);
	} catch {
		return null;
	}
}

/** One page, or nothing. */
export async function readViews(path: string): Promise<PageStat | null> {
	try {
		const [row] = await getDb()
			.select()
			.from(pageViews)
			.where(eq(pageViews.path, path))
			.limit(1);

		return row ? toStat(row) : null;
	} catch {
		return null;
	}
}

/**
 * Count a read, in one statement.
 *
 * An upsert rather than a select-then-insert-or-update, and the difference
 * matters at exactly the moment this is worth having: two readers arriving at
 * the same page in the same instant both see no row, both insert, and one of
 * them hits the primary key on `path`. `onConflictDoUpdate` makes the database
 * settle it, which is the thing databases are for.
 *
 * `views + 1` is computed in SQL rather than read into JavaScript and written
 * back, for the same reason: two increments read at once become one increment
 * written twice.
 *
 * `firstSeen` is only ever written by the insert. The update deliberately does
 * not touch it - that column is the answer to "when did this page arrive", and
 * a value that moves on every read answers nothing.
 */
export async function countView(path: string, kind: PageKind): Promise<void> {
	try {
		await getDb()
			.insert(pageViews)
			.values({ path, kind, views: 1 })
			.onConflictDoUpdate({
				target: pageViews.path,
				set: {
					views: sql`${pageViews.views} + 1`,
					lastSeen: new Date(),
				},
			});
	} catch {
		// A count that was not recorded is a count that was not recorded.
	}
}
