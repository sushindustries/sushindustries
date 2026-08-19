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
 * ── the index, as rows ───────────────────────────────────────────────────
 *
 * Three tables that are projections, not sources.
 *
 * The rule above still holds: what exists is a file in this repo, and a table
 * listing files would be a second list to keep in step. These are not that.
 * They are built by `pnpm sushindustries sync`, which drops and rewrites them
 * from the repository and the fetched shards, so they cannot disagree with
 * their source - they can only be older than it, which `syncedAt` says out
 * loud.
 *
 * They exist because a file answers "what does this say" and nothing else. A
 * table answers the questions a directory cannot: which components have no
 * examples section, which of them nobody has opened, how many tokens a page
 * costs before you spend them, which pages link to a library that just shipped
 * a breaking change. Those are joins, and joins want rows.
 *
 * Nothing reads these to render a page. The site still globs Markdown at build
 * time and would render identically with this database switched off.
 */

/**
 * Which catalogue a document came from. `source` is code, not prose.
 *
 * Nine, and the ninth is the one worth explaining. `note` is everything in
 * `.claude/` that is not a skill - the pipeline, the convention rules, the
 * checklists. They are documents by every test that matters here (they are
 * Markdown, they have a path, they cost tokens to read) and they are not
 * skills, so calling them one would make `skills` return files no runtime can
 * load.
 *
 * This list is duplicated in two places on purpose and checked in both. The
 * GraphQL enum is generated from `packages/cli/commands/graphql.mjs`, and
 * `documents.schemas.ts` in the site has it as an array a `<select>` can be
 * built from - a type cannot be iterated, and an array cannot be a column's
 * type. `documents.schemas.test.ts` asserts the two agree, because the failure
 * mode when they do not is a filter that silently returns nothing.
 */
export type DocumentKind =
	| "component"
	| "package"
	| "post"
	| "page"
	| "desk"
	| "skill"
	| "note"
	| "repo"
	| "source";

/**
 * One row per document or source file in this repository.
 *
 * The body is stored, which looks like the copy this file argues against and
 * is not: nothing reads it to serve a page, and `sync` overwrites it wholesale
 * from disk. It is here so a remote reader can answer a question without a
 * checkout, which is the entire point of the projection.
 *
 * `sha` is the content hash, so a sync can skip what has not moved and a
 * reader can tell whether the row it holds is the file it thinks it is.
 */
export const documents = pgTable("documents", {
	/** Repo-relative path. `packages/ui/docs/card/api.md`. */
	path: text("path").primaryKey(),

	kind: text("kind").$type<DocumentKind>().notNull(),

	/** The thing this belongs to: `card`, `http`, `adding-things`. */
	slug: text("slug"),

	/** For component pages: index, get-started, guides, api, examples. */
	section: text("section"),

	/** Site path, when this document is served at one. Null for source files. */
	route: text("route"),

	title: text("title"),
	summary: text("summary"),
	body: text("body").notNull(),

	words: integer("words").notNull().default(0),

	/** Estimated, at four characters per token. Enough to decide before reading. */
	tokens: integer("tokens").notNull().default(0),

	/** SHA-256 of the body. What makes a sync incremental and a row checkable. */
	sha: text("sha").notNull(),

	syncedAt: timestamp("synced_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

/**
 * One row per dependency whose documentation index we keep.
 *
 * `usedFor` is the sentence a lockfile never records: why this dependency, in
 * this repo. It comes from stack.yaml, which is written by hand for exactly
 * that reason.
 */
export const referenceProviders = pgTable("reference_providers", {
	/** Hostname, dashed. `orm-drizzle-team`. */
	provider: text("provider").primaryKey(),

	title: text("title"),

	/** The llms.txt this was cut from. */
	source: text("source").notNull(),

	/** Set when this index was itself listed by another provider's index. */
	parent: text("parent"),

	/** Comma-separated stack entries this serves. */
	usedFor: text("used_for"),

	entries: integer("entries").notNull().default(0),

	fetchedAt: text("fetched_at").notNull(),
});

export type ReferenceProvider = typeof referenceProviders.$inferSelect;

/**
 * One row per page in somebody else's documentation.
 *
 * Links, titles, section names and each provider's own one-line description,
 * taken from the machine-readable index they publish for this purpose. Never
 * page content, here or anywhere else in this repo.
 *
 * That boundary is the whole reason this is safe to store and to share. What
 * is kept is the map: enough to know which page answers a question, and not
 * enough to be a copy of thirty-five projects' documentation. Adding a `body`
 * column here would change what this table is, and it must not be added.
 */
/*
 * Named `reference_pages`, not `references`.
 *
 * REFERENCES is a reserved word in SQL - it is the foreign-key clause - so a
 * table called that has to be quoted in every statement anybody ever writes
 * against it by hand. Drizzle quotes identifiers and would have hidden this
 * forever; the first raw query found it in about a second.
 */

export const referencePages = pgTable("reference_pages", {
	/** `provider` and `url`, hashed. The URL alone is not unique across shards. */
	id: text("id").primaryKey(),

	provider: text("provider").notNull(),
	section: text("section").notNull(),
	name: text("name").notNull(),
	url: text("url").notNull(),
	description: text("description"),
});

export type ReferencePage = typeof referencePages.$inferSelect;
export type NewReferencePage = typeof referencePages.$inferInsert;

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
