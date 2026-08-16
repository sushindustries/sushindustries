/*
 * What this package publishes, and what each item needs to work.
 *
 * The source of truth is still `src/<file>` — this only records the things a
 * file cannot state about itself: which peer packages it needs at runtime, and
 * what to call it in an installer's list.
 *
 * It lives in the package rather than in the site because the package is what
 * gets installed. The site reads this to build its registry endpoints; it does
 * not own it.
 */

export interface RegistryItem {
	/** Install id and URL segment. Matches the source filename. */
	readonly name: string;
	readonly title: string;
	readonly description: string;
	/** Files copied into the consumer, relative to `src/`. */
	readonly files: readonly string[];
	/** Runtime packages this item needs, with the version it was verified against. */
	readonly dependencies: Readonly<Record<string, string>>;
	/** Other items in this registry that must be installed with it. */
	readonly registryDependencies?: readonly string[];
}

/*
 * Versions are stated, not left to `latest`. A copied component is verified
 * against one version of its dependency, and pretending otherwise is how an
 * install works for the author and breaks for everyone else.
 */
export const REGISTRY_ITEMS: readonly RegistryItem[] = [
	{
		name: "reveal",
		title: "Reveal",
		description:
			"Fades and rises its children the first time they reach the viewport. Never un-reveals.",
		files: ["reveal.tsx"],
		dependencies: {},
	},
	{
		name: "smooth-scroll",
		title: "Smooth Scroll",
		description:
			"Mounts Lenis for the page and renders nothing. Respects reduced motion.",
		files: ["smooth-scroll.tsx"],
		dependencies: { lenis: "1.3.26" },
	},
	{
		name: "scroll-spin",
		title: "Scroll Spin",
		description:
			"Rotates its children with the page scroll, in a rAF callback rather than React state.",
		files: ["scroll-spin.tsx"],
		dependencies: {},
	},
	{
		name: "card",
		title: "Card",
		description:
			"Title, optional meta, arbitrary body. Heading level is a prop so the outline stays correct.",
		files: ["card.tsx"],
		dependencies: {},
	},
	{
		name: "section",
		title: "Section",
		description:
			"Kicker, heading and body, revealing top-down with an 80ms offset.",
		files: ["section.tsx"],
		dependencies: {},
		registryDependencies: ["reveal"],
	},
	{
		name: "credit",
		title: "Credit",
		description:
			"A dependency, credited, with its author required rather than optional.",
		files: ["credit.tsx"],
		dependencies: {},
	},
	{
		name: "markdown-view",
		title: "Markdown View",
		description:
			"Renders Markdown with callouts, CSS-only tabs, custom blocks and highlighted code.",
		files: ["markdown-view.tsx", "markdown-blocks.tsx", "highlighter.ts"],
		dependencies: {
			"@tanstack/markdown": "0.0.13",
			"@tanstack/highlight": "0.0.10",
		},
	},
	{
		name: "frontmatter",
		title: "Frontmatter",
		description:
			"A small frontmatter reader for `key: value` and inline lists. Not YAML, deliberately.",
		files: ["frontmatter.ts"],
		dependencies: {},
	},
];
