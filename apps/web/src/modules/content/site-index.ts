import { listRegistry } from "../registry/registry.catalogue";
import { listComponentDocs } from "./components/components.catalogue";
import { listPackages } from "./packages/packages.catalogue";
import { listPosts } from "./posts/posts.catalogue";

/*
 * One index of everything this site publishes, in one shape.
 *
 * Every machine-readable surface is built from this: the crawler files, the
 * sitemap, and the plain-text index an assistant reads. They exist because a
 * site whose content lives in Markdown can hand that content over directly
 * instead of making something scrape rendered HTML for it.
 *
 * Assembling it once is the point. Three endpoints deriving their own lists
 * from three catalogues is three chances to publish a page in the sitemap that
 * the index does not mention.
 */

export interface IndexEntry {
	/** Site-relative path, always leading-slash. */
	readonly path: string;
	readonly title: string;
	readonly description: string;
	/** Optional Markdown source, for the full-text variant. */
	readonly body?: string;
}

export interface IndexSection {
	readonly title: string;
	readonly description: string;
	readonly entries: readonly IndexEntry[];
}

function componentEntries(): IndexEntry[] {
	const written = new Map(
		listComponentDocs().map((doc) => [doc.slug, doc] as const),
	);

	/*
	 * Driven by the registry, not by the docs folder: every registry item has a
	 * page, so listing only the hand-written ones would hide most of them.
	 */
	return listRegistry().map((item) => {
		const doc = written.get(item.name);

		return {
			path: `/components/${item.name}`,
			title: item.title,
			description: doc?.summary || item.description,
			body: doc?.sections.map((section) => section.body).join("\n\n"),
		};
	});
}

export function siteSections(): readonly IndexSection[] {
	return [
		{
			title: "Components",
			description:
				"Installable with the TanStack CLI or shadcn. Each page has a live preview.",
			entries: componentEntries(),
		},
		{
			title: "Packages",
			description: "Everything published from this monorepo.",
			entries: listPackages().map((entry) => ({
				path: `/packages/${entry.slug}`,
				title: entry.name,
				description: entry.description,
			})),
		},
		{
			title: "Writing",
			description: "Notes on how this is built.",
			entries: listPosts().map((post) => ({
				path: `/posts/${post.slug}`,
				title: post.title,
				description: post.summary,
			})),
		},
	];
}

/** Every canonical URL on the site, for the sitemap. */
export function sitePaths(): readonly string[] {
	const roots = ["/", "/components", "/packages", "/posts"];
	const entries = siteSections().flatMap((section) =>
		section.entries.map((entry) => entry.path),
	);

	return [...roots, ...entries];
}
