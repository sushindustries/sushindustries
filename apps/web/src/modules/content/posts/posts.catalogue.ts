import {
	parseFrontmatter,
	readList,
	readString,
	splitFrontmatter,
} from "@sushindustries/ui";
import type { Post, PostSummary } from "./posts.schemas";

/*
 * Posts, from `content/posts/*.md`.
 *
 * Same build-time approach as the package catalogue: `import.meta.glob` inlines
 * every file, so writing a post is adding a Markdown file and nothing else -
 * no database row, no index entry, no deploy step beyond the one that was
 * already going to happen.
 */

const FILES = import.meta.glob<string>("../../../../content/posts/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

/** `.../posts/hello-world.md` -> `hello-world` */
function slugFromPath(path: string): string {
	return path.split("/").at(-1)?.replace(/\.md$/, "") ?? "";
}

function toPost(path: string, raw: string): Post | undefined {
	const slug = slugFromPath(path);
	if (!slug) return undefined;

	const { frontmatter, body } = splitFrontmatter(raw);
	const meta = parseFrontmatter(frontmatter);

	return {
		slug,
		title: readString(meta, "title", slug),
		date: readString(meta, "date"),
		summary: readString(meta, "summary"),
		tags: readList(meta, "tags"),
		draft: readString(meta, "draft") === "true",
		image: readString(meta, "image") || undefined,
		body,
	};
}

const POSTS: readonly Post[] = Object.entries(FILES)
	.map(([path, raw]) => toPost(path, raw))
	.filter((entry): entry is Post => entry !== undefined)
	// Newest first. Undated posts sort last rather than pretending to be old.
	.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

export function listPosts(): readonly PostSummary[] {
	return POSTS.filter((post) => !post.draft);
}

export function findPost(slug: string): Post | undefined {
	return POSTS.find((post) => post.slug === slug);
}
