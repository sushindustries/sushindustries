import { getDb } from "@sushindustries/db/client";
import { eq, packageStats, sql } from "@sushindustries/db/schema";

/*
 * Read counts per package, and the rule that keeps them optional.
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

export interface PackageViews {
	readonly slug: string;
	readonly views: number;
	readonly updatedAt: string;
}

/** Every row, or nothing at all if there is no database to ask. */
export async function readAllViews(): Promise<PackageViews[] | null> {
	try {
		const rows = await getDb().select().from(packageStats);

		return rows.map((row) => ({
			slug: row.slug,
			views: row.views,
			updatedAt: row.updatedAt.toISOString(),
		}));
	} catch {
		return null;
	}
}

/** One row, or nothing. */
export async function readViews(slug: string): Promise<PackageViews | null> {
	try {
		const [row] = await getDb()
			.select()
			.from(packageStats)
			.where(eq(packageStats.slug, slug))
			.limit(1);

		if (!row) return null;

		return {
			slug: row.slug,
			views: row.views,
			updatedAt: row.updatedAt.toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Count a read, in one statement.
 *
 * An upsert rather than a select-then-insert-or-update, and the difference
 * matters at exactly the moment this is worth having: two readers arriving at
 * the same package in the same instant both see no row, both insert, and one of
 * them hits the unique index on `slug`. `onConflictDoUpdate` makes the database
 * settle it, which is the thing databases are for.
 *
 * `views + 1` is computed in SQL rather than read into JavaScript and written
 * back, for the same reason: two increments read at once become one increment
 * written twice.
 */
export async function countView(slug: string): Promise<void> {
	try {
		await getDb()
			.insert(packageStats)
			.values({ slug, views: 1 })
			.onConflictDoUpdate({
				target: packageStats.slug,
				set: {
					views: sql`${packageStats.views} + 1`,
					updatedAt: new Date(),
				},
			});
	} catch {
		// A count that was not recorded is a count that was not recorded.
	}
}
