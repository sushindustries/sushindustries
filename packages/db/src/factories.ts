import { createHash } from "node:crypto";
import type {
	DocumentKind,
	NewDocument,
	NewPageFeedback,
	NewPageView,
	NewReferencePage,
	PageKind,
} from "./schema.ts";

/*
 * Rows, built once and the same way everywhere.
 *
 * Every table here has invariants that are not in its column types: a
 * document's `sha` is the hash of its body, its `tokens` is that body's length
 * over four, its `route` is derived from its kind and slug. The columns cannot
 * express any of that, so before this file each writer computed them - `sync`
 * in the CLI, the studio's edit action in the app - and the two had already
 * drifted once: one of them hashed a trimmed string and the other did not, so
 * a save was refused for a file nobody had touched.
 *
 * A factory per table is the fix, and the property worth stating is narrow:
 * **a row that did not come from here is a row whose derived fields nothing
 * checked.** Anything writing to these tables imports from this file.
 *
 * Pure functions over the schema's own inferred types. No connection, no
 * driver, no I/O - so this stays importable from the CLI, from a server route
 * and from a test, which is exactly the set of places that write rows.
 *
 * Not `.server.ts`, and it should not become one. It is `node:crypto` and
 * arithmetic; the moment it needs a database it has stopped being a factory.
 */

/* ── the derivations ─────────────────────────────────────────────────── */

/**
 * The content hash a row carries, computed one way.
 *
 * SHA-256 over the exact bytes, hex, untrimmed. Untrimmed is the load-bearing
 * word: an editor holding a `sha` from the projection compares it against a
 * file on disk, and two hashes of "the same" text that disagree because one
 * side trimmed is a save refused for no visible reason. That happened.
 */
export const contentSha = (body: string): string =>
	createHash("sha256").update(body).digest("hex");

/**
 * Tokens, at four characters each.
 *
 * An estimate, and deliberately a crude one. A real tokeniser is a dependency,
 * a download and a per-model answer; this is used to decide whether a document
 * is worth reading before reading it, and for that question being within
 * twenty per cent is the whole requirement. The same constant is in the MCP
 * server and in `llms`, so three surfaces report the same number.
 */
export const estimateTokens = (body: string): number =>
	Math.ceil(body.length / 4);

/** Words, by whitespace. What a reader sees, where tokens are what a model pays. */
export const countWords = (body: string): number =>
	body.trim() === "" ? 0 : body.trim().split(/\s+/).length;

/**
 * Where a document is served, or null.
 *
 * The one place this mapping is written. It was in `sync.mjs` and again in the
 * studio's action layer, which is how a renamed post could keep reporting its
 * old route in one surface and the new one in the other.
 *
 * Null is a real answer and most rows have it: a source file, a skill, a note
 * and a README are all documents and none of them is a page.
 */
export function routeFor(
	kind: DocumentKind,
	slug: string | null,
	section?: string | null,
): string | null {
	if (!slug) return null;

	switch (kind) {
		case "post":
			return `/posts/${slug}`;
		case "page":
			return `/p/${slug}`;
		case "desk":
			return `/${slug}`;
		case "package":
			return `/packages/${slug}`;
		case "component":
			/*
			 * A section is a path segment, not a query.
			 *
			 * These were `?tab=api` for a while, on the reasoning that five
			 * sections are tabs of one page. They are five documents: each has
			 * its own title, its own prose and its own row in this table, and a
			 * crawler treats a query string as a variant of one page rather
			 * than as five - so four fifths of the documentation was invisible
			 * to anything that indexes by URL.
			 *
			 * `index` stays bare. It is the section you get by asking for the
			 * component, so giving it a segment would be one page at two URLs.
			 */
			return section && section !== "index"
				? `/components/${slug}/${section}`
				: `/components/${slug}`;
		default:
			return null;
	}
}

/* ── the factories ───────────────────────────────────────────────────── */

/** What a caller knows about a document. Everything else is derived. */
export interface DocumentInput {
	readonly path: string;
	readonly kind: DocumentKind;
	readonly body: string;

	readonly slug?: string | null;
	readonly section?: string | null;
	readonly title?: string | null;
	readonly summary?: string | null;

	/**
	 * Overrides the derived route.
	 *
	 * For the handful of documents whose address is not a function of their
	 * kind and slug - the home desk, a page mounted somewhere unusual. Passing
	 * it is a claim that `routeFor` is wrong for this one row, so it is worth
	 * being explicit rather than letting a caller set it by accident.
	 */
	readonly route?: string | null;

	/** For a sync that wants every row stamped with one time. Defaults to now. */
	readonly syncedAt?: Date;
}

/**
 * One document row, with everything derivable derived.
 *
 * The signature is the point: a caller supplies what only it knows - where the
 * file is, what kind it is, what is in it - and cannot supply a `sha` that
 * disagrees with the body or a `tokens` that disagrees with either.
 */
export function documentRow(input: DocumentInput): NewDocument {
	return {
		path: input.path,
		kind: input.kind,
		slug: input.slug ?? null,
		section: input.section ?? null,
		route:
			input.route !== undefined
				? input.route
				: routeFor(input.kind, input.slug ?? null, input.section),
		title: input.title ?? null,
		summary: input.summary ?? null,
		body: input.body,
		words: countWords(input.body),
		tokens: estimateTokens(input.body),
		sha: contentSha(input.body),
		syncedAt: input.syncedAt ?? new Date(),
	};
}

/**
 * One reference page row, with its own id.
 *
 * The id is a hash of provider and URL rather than the URL alone, because two
 * providers can and do list the same page - a framework's index and a hosting
 * platform's guide both pointing at the same MDN article - and a primary key
 * on the URL would silently drop one of them on insert.
 */
export function referencePageRow(input: {
	readonly provider: string;
	readonly section: string;
	readonly name: string;
	readonly url: string;
	readonly description?: string | null;
}): NewReferencePage {
	return {
		id: contentSha(`${input.provider}\n${input.url}`).slice(0, 32),
		provider: input.provider,
		section: input.section,
		name: input.name,
		url: input.url,
		description: input.description ?? null,
	};
}

/**
 * One page-view row, for a path being seen for the first time.
 *
 * Not for an increment - that is an `update` and belongs in a query, because
 * the new value depends on the old one and a factory has no way to know it.
 * This is the insert half only.
 */
export function pageViewRow(input: {
	readonly path: string;
	readonly kind: PageKind;
	readonly at?: Date;
}): NewPageView {
	const at = input.at ?? new Date();

	return {
		path: input.path,
		kind: input.kind,
		views: 1,
		firstSeen: at,
		lastSeen: at,
	};
}

/** One vote. Raw events rather than counters - see the table's own comment. */
export function pageFeedbackRow(input: {
	readonly page: string;
	readonly vote: "up" | "down";
	readonly at?: Date;
}): NewPageFeedback {
	return {
		page: input.page,
		vote: input.vote,
		createdAt: input.at ?? new Date(),
	};
}
