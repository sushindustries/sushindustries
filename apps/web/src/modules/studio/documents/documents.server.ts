import { getDb } from "@sushindustries/db/client";
import { and, asc, desc, documents, eq, sql } from "@sushindustries/db/schema";
import type { Page } from "../studio.schemas";
import type {
	DocumentDetail,
	DocumentRow,
	ParsedDocumentsQuery,
} from "./documents.schemas";

/*
 * The documents feature, reading.
 *
 * One job: turn a parsed query into rows. It does not decide who may ask -
 * that is the server function and the API route above it - and it does not
 * decide what a query may contain, which is `documents.schemas.ts` beside it.
 * Every function here takes an already-parsed object and may assume it is
 * valid, which is what keeps the SQL free of defensive clamping.
 *
 * `get*` throughout, and it is a contract rather than a style: a function
 * named `get` returns data and touches nothing. The verbs that change
 * something live in `documents.actions.server.ts`, so you can tell what a call
 * site does from the call site. Nothing in this file writes.
 *
 * Drizzle rather than raw SQL, because the column list is then the schema's
 * and not a string: adding a column to `documents` and forgetting it here is a
 * type error, where a `select *` would have been a silent `undefined` two
 * layers away.
 *
 * `.server.ts` because it opens a connection.
 */

const db = () => getDb();

/**
 * A LIKE pattern that treats the caller's text as text.
 *
 * `%` and `_` are wildcards, so without this a search for `page_views` also
 * matches `pagexviews`. Not a security hole - Drizzle parameterises the value
 * either way - and worse in practice: a search that quietly returns the wrong
 * rows and never says so.
 */
const contains = (value: string) =>
	`%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** Every sortable column, as the column rather than as a string. */
const SORTABLE = {
	path: documents.path,
	title: documents.title,
	kind: documents.kind,
	tokens: documents.tokens,
	words: documents.words,
	syncedAt: documents.syncedAt,
} as const;

/**
 * The row shape, without the body.
 *
 * Named once and used by every read here, so a column added to the table
 * appears in the browser, the API and the graph together rather than in
 * whichever of the three somebody remembered.
 */
const COLUMNS = {
	path: documents.path,
	kind: documents.kind,
	slug: documents.slug,
	section: documents.section,
	route: documents.route,
	title: documents.title,
	summary: documents.summary,
	words: documents.words,
	tokens: documents.tokens,
	sha: documents.sha,
	syncedAt: documents.syncedAt,
};

/**
 * The WHERE, built once and used twice.
 *
 * The page and its count have to be looking at the same thing, and the way
 * they stop is one of them growing a condition the other did not. Building it
 * in one place makes that impossible rather than unlikely.
 */
function conditions(query: ParsedDocumentsQuery) {
	const where = [
		query.kind ? eq(documents.kind, query.kind) : undefined,
		query.slug ? eq(documents.slug, query.slug) : undefined,
		query.section ? eq(documents.section, query.section) : undefined,
		query.search
			? sql`(${documents.title} ilike ${contains(query.search)}
				or ${documents.summary} ilike ${contains(query.search)}
				or ${documents.path} ilike ${contains(query.search)}
				or ${documents.body} ilike ${contains(query.search)})`
			: undefined,
	].filter(Boolean);

	return where.length ? and(...where) : undefined;
}

const asRow = (row: Omit<DocumentRow, "syncedAt"> & { syncedAt: Date }) => ({
	...row,
	syncedAt: row.syncedAt.toISOString(),
});

/**
 * A page of documents, and how many there are.
 *
 * The body is never selected. Some of these rows are source files of a couple
 * of thousand lines, and fifty of them is megabytes crossing the wire to draw
 * a table of titles. `getDocument` fetches one when somebody opens one.
 */
export async function getDocuments(
	query: ParsedDocumentsQuery,
): Promise<Page<DocumentRow>> {
	const where = conditions(query);
	const order = query.direction === "desc" ? desc : asc;

	const [rows, [counted]] = await Promise.all([
		db()
			.select(COLUMNS)
			.from(documents)
			.where(where)
			.orderBy(order(SORTABLE[query.sort]))
			.limit(query.limit)
			.offset(query.offset),

		db()
			.select({ total: sql<number>`count(*)::int` })
			.from(documents)
			.where(where),
	]);

	return {
		rows: rows.map(asRow),
		total: counted?.total ?? 0,
		limit: query.limit,
		offset: query.offset,
	};
}

/** One document, body included. The only place the body is read. */
export async function getDocument(
	path: string,
): Promise<DocumentDetail | null> {
	const [row] = await db()
		.select({ ...COLUMNS, body: documents.body })
		.from(documents)
		.where(eq(documents.path, path))
		.limit(1);

	return row ? { ...asRow(row), body: row.body } : null;
}

/**
 * Every document sharing a slug, in path order.
 *
 * What a move operates on. A component is five files and one name, so the unit
 * a rename touches is the slug rather than the path - and the action layer
 * needs the list before it can plan anything.
 */
export async function getDocumentsBySlug(
	kind: string,
	value: string,
): Promise<readonly DocumentRow[]> {
	const rows = await db()
		.select(COLUMNS)
		.from(documents)
		.where(and(eq(documents.kind, kind as never), eq(documents.slug, value)))
		.orderBy(asc(documents.path));

	return rows.map(asRow);
}

/**
 * Which documents mention a route, by looking in the bodies.
 *
 * A substring search rather than a parsed link graph, and the difference is
 * worth stating: this over-reports - a route named in prose counts - and never
 * under-reports, which is the right direction for a warning shown *before* a
 * rename. A missed link is a 404 in production; an extra one is a line in a
 * list somebody reads for ten seconds.
 */
export async function getDocumentsLinkingTo(
	route: string,
): Promise<readonly string[]> {
	const rows = await db()
		.select({ path: documents.path })
		.from(documents)
		.where(sql`${documents.body} like ${contains(route)}`)
		.orderBy(asc(documents.path))
		.limit(50);

	return rows.map((row) => row.path);
}

/**
 * Every distinct value of a column, with how many documents have it.
 *
 * What the filter rail is built from. Read rather than hard-coded, so a kind
 * with no documents in it is a filter that is not offered - a control that
 * always returns nothing is worse than a control that is not there.
 */
export async function getDocumentFacets(
	column: "kind" | "section",
): Promise<readonly { value: string; count: number }[]> {
	const field = column === "kind" ? documents.kind : documents.section;

	const rows = await db()
		.select({ value: field, count: sql<number>`count(*)::int` })
		.from(documents)
		.where(sql`${field} is not null`)
		.groupBy(field)
		.orderBy(desc(sql`count(*)`));

	return rows.map((row) => ({ value: String(row.value), count: row.count }));
}
