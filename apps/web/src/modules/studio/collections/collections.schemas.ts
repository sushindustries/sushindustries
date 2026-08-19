import { z } from "zod";
import { DOCUMENT_KINDS, DOCUMENT_SORTS } from "../documents/documents.schemas";
import { slug } from "../studio.schemas";

/*
 * A collection is a saved query, not a saved list.
 *
 * This is the decision the whole feature turns on, and it was very nearly the
 * other one. The obvious design is a file holding names - "the starter set is
 * button, card, dialog" - and it is wrong here for a reason this repository
 * already demonstrates: `skills` in the graph has always been a *view* over
 * the documents whose kind is `skill`, never a table of them. Nobody maintains
 * it. Adding a skill adds it to the list, because the list is a question
 * rather than an answer.
 *
 * A hand-written list has the opposite property. It is correct the day it is
 * written and wrong from the first document added afterwards, and nothing ever
 * says so - a collection quietly missing three things looks exactly like a
 * collection that is complete.
 *
 * So: a collection carries a filter, and its membership is computed when
 * somebody asks. That is what makes them dynamic. `skills` is one of them, and
 * is now defined the same way everything else is rather than being special.
 *
 * They are Markdown files in `content/collections/`, globbed at build time
 * like posts and pages. Which means creating, renaming and deleting one is
 * something the studio's existing action layer already does - a collection is
 * a document, so the code that moves documents moves collections, and there is
 * no second write path.
 */

/**
 * The filter a collection saves, which is a subset of a documents query.
 *
 * A subset on purpose. `offset` is not here, because a collection is a set
 * rather than a page of one; `search` is, because "everything that mentions
 * Drizzle" is a perfectly good thing to name and keep.
 */
export const collectionFilter = z.object({
	kind: z.enum(DOCUMENT_KINDS).optional(),
	section: z.string().max(64).optional(),
	search: z.string().max(200).optional(),

	sort: z.enum(DOCUMENT_SORTS).default("path"),
	direction: z.enum(["asc", "desc"]).default("asc"),

	/**
	 * How many members to show. Not how many there are - the count is always
	 * the whole set, and this only bounds what is carried back, so a collection
	 * matching four hundred source files is still cheap to ask about.
	 */
	limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CollectionFilter = z.output<typeof collectionFilter>;

export const collection = collectionFilter.extend({
	id: slug,
	title: z.string().min(1).max(120),
	summary: z.string().max(400).default(""),

	/** The path of the file that defines it. What the studio edits. */
	path: z.string(),

	/**
	 * Excluded from the graph and from `list-collections`, and still readable
	 * by id. The same meaning `draft:` has on a post, so a collection being
	 * worked on behaves the way everything else being worked on behaves.
	 */
	draft: z.boolean().default(false),

	/** What it is for, in the author's own words. Rendered on its page. */
	body: z.string().default(""),
});

export type Collection = z.output<typeof collection>;

/** A collection with the documents it currently matches. */
export interface CollectionMembers {
	readonly collection: Collection;

	/** How many documents match. Always the whole set, never the page. */
	readonly total: number;

	readonly members: readonly {
		readonly path: string;
		readonly kind: string;
		readonly slug: string | null;
		readonly section: string | null;
		readonly route: string | null;
		readonly title: string | null;
		readonly summary: string | null;
		readonly tokens: number;
	}[];

	/**
	 * What the whole collection costs to read.
	 *
	 * The number an agent needs before it decides to read one, and the reason
	 * a collection is worth being a first-class thing rather than a saved
	 * search: "the conventions" is 14,000 tokens is an answer you can act on.
	 */
	readonly tokens: number;
}
