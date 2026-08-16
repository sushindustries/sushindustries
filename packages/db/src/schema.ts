import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/*
 * The schema is client-safe on purpose.
 *
 * It carries table shapes and column types and nothing else - no connection
 * string, no driver. That is what lets a route import the inferred types for a
 * form or a table without dragging a Postgres client into the browser bundle.
 * The client lives in `client.server.ts`, which cannot be imported from the
 * client at all.
 */

/** One row per package in `packages/`, for the counters the site shows. */
export const packageStats = pgTable("package_stats", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Directory name under `packages/`. The join key to the filesystem. */
	slug: text("slug").notNull().unique(),

	views: integer("views").notNull().default(0),

	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type PackageStat = typeof packageStats.$inferSelect;
export type NewPackageStat = typeof packageStats.$inferInsert;
