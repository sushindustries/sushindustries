import { parseFrontmatter, readString } from "@sushindustries/ui";

/*
 * Built pages: Markdown assembled from the block layer.
 *
 * `pnpm new page <slug>` writes `content/pages/<slug>.md` and it appears at
 * `/p/<slug>` on the next build - the page builder is the block system the
 * site already has, pointed at a page-shaped file. Same catalogue mechanics
 * as posts: `import.meta.glob`, eager, public, identical for every visitor,
 * so deliberately not a server function.
 */

export interface BuiltPage {
	readonly slug: string;
	readonly title: string;
	readonly summary: string;
	readonly updated?: string;
	/** `og:image` for this page. Site-relative or absolute; absent falls back to the site mark. */
	readonly image?: string;
	readonly body: string;
}

const FILES = import.meta.glob<string>("../../../../content/pages/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
	if (!match) return { frontmatter: "", body: raw };
	return { frontmatter: match[1] ?? "", body: raw.slice(match[0].length) };
}

function toPage(path: string, raw: string): BuiltPage | undefined {
	const slug = path.split("/").at(-1)?.replace(/\.md$/, "");
	if (!slug) return undefined;

	const { frontmatter, body } = splitFrontmatter(raw);
	const meta = parseFrontmatter(frontmatter);

	// Drafts build locally and ship nowhere, same contract as posts.
	if (readString(meta, "draft") === "true") return undefined;

	return {
		slug,
		title: readString(meta, "title", slug),
		summary: readString(meta, "summary"),
		updated: readString(meta, "updated") || undefined,
		image: readString(meta, "image") || undefined,
		body,
	};
}

const PAGES: readonly BuiltPage[] = Object.entries(FILES)
	.map(([path, raw]) => toPage(path, raw))
	.filter((page): page is BuiltPage => page !== undefined);

export function listBuiltPages(): readonly BuiltPage[] {
	return PAGES;
}

export function findBuiltPage(slug: string): BuiltPage | undefined {
	return PAGES.find((page) => page.slug === slug);
}
