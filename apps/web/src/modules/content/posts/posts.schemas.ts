/*
 * Client-safe shapes for written content. No filesystem, no driver.
 */

export interface PostSummary {
	/** Filename without the extension. The URL segment. */
	readonly slug: string;
	readonly title: string;
	/** ISO date from frontmatter. Empty string sorts last. */
	readonly date: string;
	readonly summary: string;
	readonly tags: readonly string[];
	/** Set `draft: true` in frontmatter to keep a post off the index. */
	readonly draft: boolean;
	/** `og:image` for this post. Site-relative or absolute; absent falls back to the site mark. */
	readonly image?: string;
}

export interface Post extends PostSummary {
	/** Markdown body with the frontmatter block already stripped. */
	readonly body: string;
}
