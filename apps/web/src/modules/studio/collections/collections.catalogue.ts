import { parseFrontmatter, readString } from "@sushindustries/ui";
import {
	type Collection,
	collection as collectionSchema,
} from "./collections.schemas";

/*
 * Collections, from `content/collections/*.md`.
 *
 * The same build-time approach as posts and packages: `import.meta.glob`
 * inlines every file, so defining a collection is adding a Markdown file and
 * nothing else - no row, no index entry, no deploy step beyond the one that
 * was already going to happen.
 *
 * A definition rather than a membership. What is inlined here is the *filter*;
 * which documents match it is a query against the projection, run when
 * somebody asks. That is why this is a `.catalogue.ts` and its answer still
 * needs a `.server.ts` beside it - the two halves are "what is a collection"
 * and "what is in it right now", and only the second one needs a database.
 *
 * `.catalogue.ts`, so it is importable from anywhere: the route that renders
 * the list, the MCP server that lists them, and the graph all read this one
 * array.
 */

const FILES = import.meta.glob<string>("../../../../content/collections/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

/** `.../collections/conventions.md` -> `conventions` */
const idFromPath = (path: string) =>
	path.split("/").at(-1)?.replace(/\.md$/, "") ?? "";

/**
 * The repository-relative path, from the glob's relative one.
 *
 * The studio edits collections through the same action layer it edits posts
 * with, and that layer speaks repository paths. Reconstructing it here means
 * the catalogue hands over something the writer can act on, rather than a
 * `../../../../` that only means anything to Vite.
 */
const repoPath = (id: string) => `apps/web/content/collections/${id}.md`;

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { frontmatter: "", body: raw };
	return { frontmatter: match[1] ?? "", body: raw.slice(match[0].length) };
}

function toCollection(path: string, raw: string): Collection | undefined {
	const id = idFromPath(path);
	if (!id) return undefined;

	const { frontmatter, body } = splitFrontmatter(raw);
	const meta = parseFrontmatter(frontmatter);

	/*
	 * Parsed rather than cast, and a bad one is dropped rather than thrown.
	 *
	 * A collection with a `kind:` that is not a kind is a file somebody typed
	 * wrong, and the right answer is that the collection does not appear -
	 * throwing would take the whole site's build down over one Markdown file,
	 * which is a much worse trade than one missing list entry.
	 */
	const parsed = collectionSchema.safeParse({
		id,
		path: repoPath(id),
		title: readString(meta, "title", id),
		summary: readString(meta, "summary"),
		kind: readString(meta, "kind") || undefined,
		section: readString(meta, "section") || undefined,
		search: readString(meta, "search") || undefined,
		sort: readString(meta, "sort") || undefined,
		direction: readString(meta, "direction") || undefined,
		limit: readString(meta, "limit") || undefined,
		draft: readString(meta, "draft") === "true",
		body,
	});

	return parsed.success ? parsed.data : undefined;
}

const COLLECTIONS: readonly Collection[] = Object.entries(FILES)
	.map(([path, raw]) => toCollection(path, raw))
	.filter((one): one is Collection => Boolean(one))
	.sort((a, b) => a.title.localeCompare(b.title));

/** Every collection that is not a draft. */
export function listCollections(): readonly Collection[] {
	return COLLECTIONS.filter((one) => !one.draft);
}

/**
 * One collection by id, drafts included.
 *
 * Drafts are readable by id and absent from the list, which is the same
 * contract a draft post has: you can open the one you are working on, and
 * nobody finds it by browsing.
 */
export function findCollection(id: string): Collection | undefined {
	return COLLECTIONS.find((one) => one.id === id);
}
