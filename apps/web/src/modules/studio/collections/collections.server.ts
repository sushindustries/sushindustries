import { getDb } from "@sushindustries/db/client";
import { and, asc, desc, documents, eq, sql } from "@sushindustries/db/schema";
import { findCollection, listCollections } from "./collections.catalogue";
import type { Collection, CollectionMembers } from "./collections.schemas";

/*
 * What is in a collection, right now.
 *
 * The catalogue beside this says what a collection *is* - a title, a summary
 * and a filter, inlined at build time from a Markdown file. This runs the
 * filter. Splitting them is what makes a collection dynamic: the definition is
 * fixed at build, the membership is a query, and a document added tomorrow
 * joins every collection whose filter it matches without anybody editing a
 * list.
 *
 * `get*` throughout, like the documents feature: a function named `get`
 * returns data and touches nothing. Nothing here writes - a collection is
 * changed by changing the file that defines it, which the documents action
 * layer already knows how to do, because a collection *is* a document.
 *
 * `.server.ts` because it opens a connection.
 */

const db = () => getDb();

/** Treats the caller's text as text - `%` and `_` are LIKE wildcards. */
const contains = (value: string) =>
	`%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const SORTABLE = {
	path: documents.path,
	title: documents.title,
	kind: documents.kind,
	tokens: documents.tokens,
	words: documents.words,
	syncedAt: documents.syncedAt,
} as const;

/**
 * The filter, as SQL.
 *
 * Built from the same fields `documents.server.ts` builds its WHERE from, and
 * deliberately not shared with it. That function takes a parsed *query* - with
 * an offset, a slug and its own paging - and this takes a saved *filter*; one
 * function serving both would grow a parameter for every field only one of
 * them has, which is the shape that eventually gets one of them wrong.
 */
function conditions(collection: Collection) {
	const where = [
		collection.kind ? eq(documents.kind, collection.kind) : undefined,
		collection.section ? eq(documents.section, collection.section) : undefined,
		collection.search
			? sql`(${documents.title} ilike ${contains(collection.search)}
				or ${documents.summary} ilike ${contains(collection.search)}
				or ${documents.path} ilike ${contains(collection.search)}
				or ${documents.body} ilike ${contains(collection.search)})`
			: undefined,
	].filter(Boolean);

	return where.length ? and(...where) : undefined;
}

/**
 * One collection and what currently matches it.
 *
 * `total` and `tokens` are over the whole set, `members` is the first `limit`
 * of it. That asymmetry is the point: an agent deciding whether to read a
 * collection needs to know it is four hundred files and 900,000 tokens
 * *before* it asks for any of them, and a count that only described the page
 * would answer the wrong question.
 */
export async function getCollection(
	id: string,
): Promise<CollectionMembers | null> {
	const collection = findCollection(id);
	if (!collection) return null;

	const where = conditions(collection);
	const order = collection.direction === "desc" ? desc : asc;

	const [members, [totals]] = await Promise.all([
		db()
			.select({
				path: documents.path,
				kind: documents.kind,
				slug: documents.slug,
				section: documents.section,
				route: documents.route,
				title: documents.title,
				summary: documents.summary,
				tokens: documents.tokens,
			})
			.from(documents)
			.where(where)
			.orderBy(order(SORTABLE[collection.sort]))
			.limit(collection.limit),

		db()
			.select({
				total: sql<number>`count(*)::int`,
				tokens: sql<number>`coalesce(sum(${documents.tokens}), 0)::int`,
			})
			.from(documents)
			.where(where),
	]);

	return {
		collection,
		members,
		total: totals?.total ?? 0,
		tokens: totals?.tokens ?? 0,
	};
}

/**
 * Every collection, with its size but not its members.
 *
 * One query rather than one per collection. There are a handful of these and
 * a loop would be correct and would also be the shape that turns into twenty
 * round trips the day somebody adds twenty collections - `count` per filter
 * in a single statement costs the same as one.
 *
 * The counts are computed by running each filter as a scalar subquery, which
 * is why the SQL is assembled rather than built with the query builder: the
 * set of conditions is data, and Drizzle's builder describes one statement
 * rather than a variable number of them.
 */
export async function getCollections(): Promise<
	readonly {
		collection: Collection;
		total: number;
		tokens: number;
	}[]
> {
	const all = listCollections();
	if (all.length === 0) return [];

	const counted = await Promise.all(
		all.map(async (collection) => {
			const where = conditions(collection);
			const [totals] = await db()
				.select({
					total: sql<number>`count(*)::int`,
					tokens: sql<number>`coalesce(sum(${documents.tokens}), 0)::int`,
				})
				.from(documents)
				.where(where);

			return {
				collection,
				total: totals?.total ?? 0,
				tokens: totals?.tokens ?? 0,
			};
		}),
	);

	// Largest first. A collection with nothing in it is usually a filter that
	// is wrong, and putting those at the bottom is where they get noticed.
	return counted.sort((a, b) => b.total - a.total);
}
