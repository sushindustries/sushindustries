import { pageTitle, SITE } from "./site.catalogue";

/*
 * One head, said once.
 *
 * Every route was writing `title` and `description` by hand and stopping
 * there, which left the tags social cards actually read - `og:*` and
 * `twitter:*` - to whatever the root happened to set. This is the shape the
 * TanStack Start SEO guide recommends: a helper that takes what a page knows
 * about itself and returns the full set, so a page cannot ship half a head.
 *
 * The router deduplicates meta by name with the leaf winning, so the root
 * calls this with nothing and every page that calls it with something
 * overrides cleanly.
 */

interface SeoInput {
	/** The page's own part; `pageTitle()` adds the site name. */
	title?: string;
	description?: string;
	/** Route path for the canonical URL, e.g. `/posts/why`. Absent = no canonical. */
	path?: string;
	/** Site-relative or absolute. Unfurlers require absolute; this resolves it. */
	image?: string;
	type?: "website" | "article";
	/*
	 * The 404 branch of a dynamic route. The HTTP status is already correct -
	 * TanStack Start answers `notFound()` with a real 404, which is what stops
	 * a crawler on its own - but the loader still ran head() with no
	 * loaderData, and every dynamic route was falling back to a generic title
	 * ("Post - Adam Jurek") instead of saying what happened. This is the
	 * belt to that status code's suspenders: a page that says it is missing
	 * rather than implying, wrongly, that something is here.
	 */
	notFound?: boolean;
}

interface Head {
	meta: Array<Record<string, string>>;
	links: Array<Record<string, string>>;
}

export function seo(input: SeoInput = {}): Head {
	const title = pageTitle(input.notFound ? "Not found" : input.title);
	const description = input.notFound
		? "This page doesn't exist, or the thing it named is gone."
		: input.description || SITE.description;
	const image = new URL(input.image ?? SITE.image, SITE.url).href;

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:image", content: image },
			{ property: "og:site_name", content: SITE.name },
			{ property: "og:type", content: input.type ?? "website" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: image },
			// Defense in depth: the 404 status is what actually stops a
			// crawler, but a page that also says so survives anywhere the
			// status gets lost - a cache, a proxy, a scraper reading only HTML.
			...(input.notFound ? [{ name: "robots", content: "noindex" }] : []),
		],
		links:
			input.path && !input.notFound
				? [{ rel: "canonical", href: new URL(input.path, SITE.url).href }]
				: [],
	};
}
