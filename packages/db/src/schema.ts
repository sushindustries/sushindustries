import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { SchemaTypeName } from "./schema-org.generated";

/*
 * The schema is client-safe on purpose.
 *
 * It carries table shapes and column types and nothing else - no connection
 * string, no driver. That is what lets a route import the inferred types for a
 * form or a table without dragging a Postgres client into the browser bundle.
 * The client lives in `client.server.ts`, which cannot be imported from the
 * client at all.
 */

/** Which catalogue a counted page came from. */
export type PageKind = "component" | "package" | "post" | "page";

/*
 * One row per page anybody has actually opened.
 *
 * What exists is not stored here, and must not be. Every component, package,
 * post and page is a file in this repo, globbed at build time, so a table
 * listing them would be a second list to keep in step with the first - the
 * exact thing the catalogues exist to avoid.
 *
 * What a build cannot know is what happened afterwards. That is this table,
 * and it answers the two questions worth asking about anything published:
 *
 *   was it added?   `firstSeen` - the first time anyone asked for the path
 *   is it used?     `views` and `lastSeen` - and no row at all means never
 *
 * Keyed by path rather than by slug, because a slug is only unique inside its
 * own catalogue: `/components/archive` and `/posts/archive` are two pages and
 * one slug. The path is what a visitor asked for and what a page already
 * knows about itself, so nothing has to be told which kind it is twice.
 *
 * This replaced `package_stats`, which counted one catalogue out of four. The
 * other three had no answer to "does anyone open this", which for a component
 * library is the question.
 */
export const pageViews = pgTable("page_views", {
	/** Route path, e.g. `/components/button`. The join key to the catalogue. */
	path: text("path").primaryKey(),

	/** Kept beside the path so counting one catalogue needs no path parsing. */
	kind: text("kind").$type<PageKind>().notNull(),

	views: integer("views").notNull().default(0),

	firstSeen: timestamp("first_seen", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/** Most recent view, so a page that stopped being read is visible as one. */
	lastSeen: timestamp("last_seen", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;

/*
 * One row per vote on a documentation page.
 *
 * Raw events rather than counters, on purpose: a counter answers exactly one
 * question and destroys the data that would have answered the next. Rows can
 * be counted, windowed by day, or joined against a page rename - a pair of
 * integers can only ever go up.
 */
export const pageFeedback = pgTable("page_feedback", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Route path of the page judged, e.g. `/components/code-block`. */
	page: text("page").notNull(),

	/** `up` or `down`. Text rather than an enum: a migration per emotion is too many. */
	vote: text("vote").notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type PageFeedback = typeof pageFeedback.$inferSelect;
export type NewPageFeedback = typeof pageFeedback.$inferInsert;

/*
 * schema.org, as the shape of the JSON-LD a page emits.
 *
 * Every element that shows content has a type at schema.org that already
 * describes it, and there is no reason to invent a second vocabulary beside
 * one that a search engine, a reader mode and another agent all already parse.
 *
 * There is deliberately no table behind this. One existed, keyed by type and
 * slug, and nothing ever wrote to it: every page builds its JSON-LD from what
 * it already has in hand - the video block from its own Markdown attributes,
 * a component page from its registry entry - because that content is a file
 * in this repo, not a row. Storing it would have been a copy that drifts.
 *
 * `SchemaTypeName` still comes from the generated vocabulary, and
 * `schemaProperties()` in `@sushindustries/db/schema-org` still validates
 * against it. That module is a separate entry because the vocabulary is
 * ninety kilobytes and only the type name is needed here; a type import
 * costs nothing at runtime.
 *
 * https://schema.org/Thing
 */

/**
 * The half of a thing that describes it rather than the row it sits in.
 *
 * A page usually has this to hand without a database - the video block builds
 * one from its own Markdown attributes - so the serialiser takes this, and a
 * stored row satisfies it by being a superset.
 */
export interface ThingFields {
	readonly type: SchemaTypeName;
	readonly name: string;
	readonly description?: string | null;
	readonly url?: string | null;
	readonly image?: string | null;
	readonly properties?: Readonly<Record<string, unknown>>;
}

/**
 * One thing, as schema.org JSON-LD.
 *
 * Empty values are dropped rather than serialised as null: a consumer reading
 * `"uploadDate": null` has been told something false, where a missing key only
 * says nothing. Dates are ISO strings, which is what the standard asks for and
 * what a `Date` from a row is not.
 */
export function thingLd(thing: ThingFields): object {
	const entries: Array<[string, unknown]> = [
		["@context", "https://schema.org"],
		["@type", thing.type],
		["name", thing.name],
		["description", thing.description],
		["url", thing.url],
		["image", thing.image],
		...Object.entries(thing.properties ?? {}),
	];

	return Object.fromEntries(
		entries
			.map(([key, value]) => [
				key,
				value instanceof Date ? value.toISOString() : value,
			])
			.filter(
				([, value]) => value !== undefined && value !== null && value !== "",
			),
	);
}

/*
 * The query builders, re-exported.
 *
 * So that a consumer needs one dependency rather than two. Importing
 * `drizzle-orm` directly in the app would mean a second copy of the version
 * pinned here, and the way that goes wrong is not a missing module - it is two
 * `eq` functions that build subtly different SQL against one schema, which
 * looks like a query bug and is a dependency bug.
 *
 * Client-safe, like the rest of this file: these are pure builders that produce
 * an object describing a query. Nothing here opens a connection - that is
 * `client.server.ts`, which cannot be imported from a browser at all.
 */
export { and, asc, desc, eq, or, sql } from "drizzle-orm";
