import { sql } from "drizzle-orm";
import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
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
 * schema.org, as the data model.
 *
 * Every element that shows content has a type at schema.org that already
 * describes it, and there is no reason to invent a second vocabulary beside
 * one that a search engine, a reader mode and another agent all already parse.
 * So an element is a `Thing` here, its `type` is a class from the published
 * vocabulary, and the JSON-LD a page emits is the row with an `@type` on it
 * rather than a second object somebody keeps in step by hand.
 *
 * One table rather than nine hundred. A table per class would be a migration
 * per class, for a vocabulary whose whole point is that it is open - and the
 * columns below are exactly the properties `Thing` itself declares, which is
 * to say the ones every class inherits and every query wants to filter on.
 * Everything a subtype adds lives in `properties`, validated against
 * `schemaProperties()` from `@sushindustries/db/schema-org`.
 *
 * That module is a separate entry on purpose: the vocabulary is ninety
 * kilobytes of generated data, and only the type name is needed here. A type
 * import costs nothing at runtime.
 *
 * https://schema.org/Thing
 */
export const things = pgTable(
	"things",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

		/**
		 * The schema.org class, e.g. `VideoObject`, `SoftwareSourceCode`.
		 * Text rather than an enum: nine hundred values is not an enum, and the
		 * vocabulary gains classes without asking this database first.
		 */
		type: text("type").$type<SchemaTypeName>().notNull(),

		/** Our id for it: a registry name, a page path, a slug. */
		slug: text("slug").notNull(),

		/* The properties `Thing` declares, as columns, because these are the
		   ones worth an index and a filter. https://schema.org/Thing */
		name: text("name").notNull(),
		description: text("description"),
		url: text("url"),
		image: text("image"),

		/**
		 * Everything the subtype adds: `uploadDate` on a VideoObject,
		 * `programmingLanguage` on SoftwareSourceCode. Keys are checked against
		 * the vocabulary before a write, so this is open rather than untyped.
		 */
		properties: jsonb("properties")
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	/* One row per thing, not one per time something wrote about it. */
	(table) => [unique("things_type_slug").on(table.type, table.slug)],
);

export type Thing = typeof things.$inferSelect;
export type NewThing = typeof things.$inferInsert;

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
