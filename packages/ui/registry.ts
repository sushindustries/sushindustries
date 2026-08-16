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

/*
 * Coarse groups, chosen so every item lands in exactly one. An item that
 * plausibly fits two means the groups are wrong, not that it needs a second
 * tag.
 */
export type RegistryCategory = "motion" | "layout" | "content" | "docs" | "3d";

export const REGISTRY_CATEGORIES: ReadonlyArray<{
	id: RegistryCategory;
	label: string;
}> = [
	{ id: "motion", label: "Motion" },
	{ id: "layout", label: "Layout" },
	{ id: "content", label: "Content" },
	{ id: "docs", label: "Docs" },
	{ id: "3d", label: "3D" },
];

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
	readonly category: RegistryCategory;
	/** A finer grouping inside the category. For reading, not filtering. */
	readonly subcategory?: string;
	/** Cross-cutting labels. These are filterable. */
	readonly tags?: readonly string[];
	/**
	 * What the preview shows, for readers who cannot see it. A card in a grid
	 * has no room to explain itself twice.
	 */
	readonly preview: string;
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
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "intersection", "no-deps"],
		preview: "A card fading and rising into place",
	},
	{
		name: "smooth-scroll",
		title: "Smooth Scroll",
		description:
			"Mounts Lenis for the page and renders nothing. Respects reduced motion.",
		files: ["smooth-scroll.tsx"],
		dependencies: { lenis: "1.3.26" },
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "lenis"],
		preview: "Nothing to see — it changes how the page scrolls",
	},
	{
		name: "scroll-spin",
		title: "Scroll Spin",
		description:
			"Rotates its children with the page scroll, in a rAF callback rather than React state.",
		files: ["scroll-spin.tsx"],
		dependencies: {},
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "transform", "no-deps"],
		preview: "A mark turning as the frame scrolls",
	},
	{
		name: "card",
		title: "Card",
		description:
			"Title, optional meta, arbitrary body. Heading level is a prop so the outline stays correct.",
		files: ["card.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Containers",
		tags: ["surface", "no-deps"],
		preview: "Two cards: one with meta, one as a link",
	},
	{
		name: "section",
		title: "Section",
		description:
			"Kicker, heading and body, revealing top-down with an 80ms offset.",
		files: ["section.tsx"],
		dependencies: {},
		registryDependencies: ["reveal"],
		category: "layout",
		subcategory: "Page structure",
		tags: ["heading", "scroll", "no-deps"],
		preview: "A kicker and heading revealing before the body",
	},
	{
		name: "doc-aside",
		title: "Doc Aside",
		description:
			"An on-page table of contents: a sticky rail on desktop, a collapsed row on mobile. Collapse is CSS, not state.",
		files: ["doc-aside.tsx", "headings.ts"],
		dependencies: { "@tanstack/markdown": "0.0.13" },
		category: "docs",
		subcategory: "Navigation",
		tags: ["markdown", "scroll", "responsive"],
		preview: "A contents list tracking the heading you are under",
	},
	{
		name: "showcase",
		title: "Showcase",
		description:
			"A component shown at three viewport widths in a real iframe, with its source and install commands.",
		files: ["showcase.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Presentation",
		tags: ["iframe", "responsive"],
		preview: "A component shown at three viewport widths",
	},
	{
		name: "credit",
		title: "Credit",
		description:
			"A dependency, credited, with its author required rather than optional.",
		files: ["credit.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Attribution",
		tags: ["surface", "no-deps"],
		preview: "A dependency listed with its author",
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
		category: "content",
		subcategory: "Rendering",
		tags: ["markdown", "highlight", "ssr"],
		preview: "Markdown with callouts, tabs and highlighted code",
	},
	{
		name: "frontmatter",
		title: "Frontmatter",
		description:
			"A small frontmatter reader for `key: value` and inline lists. Not YAML, deliberately.",
		files: ["frontmatter.ts"],
		dependencies: {},
		category: "content",
		subcategory: "Parsing",
		tags: ["markdown", "no-deps"],
		preview: "No UI — it reads the metadata block off a file",
	},
];
