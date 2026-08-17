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
 * schema.org, as tables.
 *
 * Every element that shows content on this site has a type at schema.org that
 * already describes it, and there is no reason to invent a second vocabulary
 * beside it. So the columns here are the property names from the published
 * type, spelled the way the standard spells them, and the JSON-LD a page emits
 * is that row with an `@type` on it rather than a separate object somebody
 * keeps in step by hand.
 *
 * Which is the point of putting them in the schema package: an element's data
 * shape, its database row and its structured data become one definition, and
 * the next element that needs one adds a table beside this rather than a new
 * convention. `VideoObject` is the first because the video player is the first
 * element whose content is not simply the page it sits on.
 *
 * https://schema.org/VideoObject
 */
export const videoObjects = pgTable("video_objects", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Where it is shown, so a row can be found from a route. Not schema.org. */
	page: text("page").notNull(),

	/** schema.org/name. The title, and what a search result shows. */
	name: text("name").notNull(),

	/** schema.org/description. One or two sentences. */
	description: text("description"),

	/** schema.org/thumbnailUrl. The still, and the poster the player uses. */
	thumbnailUrl: text("thumbnail_url"),

	/**
	 * schema.org/uploadDate. Required by Google for a video rich result, and
	 * deliberately nullable: a date nobody knows is better absent than invented,
	 * and the emitter drops the key rather than sending a guess.
	 */
	uploadDate: timestamp("upload_date", { withTimezone: true }),

	/** schema.org/duration, as an ISO 8601 duration: `PT3M33S`. */
	duration: text("duration"),

	/** schema.org/embedUrl. The player URL - what an iframe would point at. */
	embedUrl: text("embed_url"),

	/** schema.org/contentUrl. The media file itself, when there is one. */
	contentUrl: text("content_url"),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type VideoObject = typeof videoObjects.$inferSelect;
export type NewVideoObject = typeof videoObjects.$inferInsert;

/**
 * The half of a `VideoObject` that describes the video rather than the row.
 *
 * A page usually has these to hand without a database - the video block builds
 * one from its own Markdown attributes - so the emitter takes this rather than
 * a row, and a stored row satisfies it by being a superset.
 */
export type VideoObjectFields = Partial<
	Pick<
		NewVideoObject,
		"description" | "thumbnailUrl" | "duration" | "embedUrl" | "contentUrl"
	>
> & {
	name: string;
	/** ISO 8601 date. A `Date` from a row is accepted and serialised. */
	uploadDate?: Date | string | null;
};

/**
 * One row, or one set of fields, as schema.org JSON-LD.
 *
 * Empty keys are dropped rather than sent as null: a consumer reading
 * `"uploadDate": null` has been told something false, where a missing key
 * only says nothing.
 */
export function videoObjectLd(video: VideoObjectFields): object {
	const uploaded =
		video.uploadDate instanceof Date
			? video.uploadDate.toISOString()
			: video.uploadDate;

	return Object.fromEntries(
		Object.entries({
			"@context": "https://schema.org",
			"@type": "VideoObject",
			name: video.name,
			description: video.description,
			thumbnailUrl: video.thumbnailUrl,
			uploadDate: uploaded,
			duration: video.duration,
			embedUrl: video.embedUrl,
			contentUrl: video.contentUrl,
		}).filter(
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
