import type { IconName } from "./src/icon";

/*
 * What this package publishes, and what each item needs to work.
 *
 * The source of truth is still `src/<file>` - this only records the things a
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

/*
 * Every category carries its glyph, because both the nav and the archive show
 * one. Icon names come from `glyphs.md`; `pnpm doctor` rejects a category whose
 * icon is not in that table, and a category with no icon at all.
 */
export const REGISTRY_CATEGORIES: ReadonlyArray<{
	id: RegistryCategory;
	label: string;
	icon: IconName;
	/** One line, shown under the label in the nav panel. */
	blurb: string;
}> = [
	{
		id: "motion",
		label: "Motion",
		icon: "motion",
		blurb: "Scroll effects and reveals, all reduced-motion aware",
	},
	{
		id: "layout",
		label: "Layout",
		icon: "grid",
		blurb: "Containers, grids and the spacing between things",
	},
	{
		id: "content",
		label: "Content",
		icon: "text",
		blurb: "Rendering Markdown, and reading what is at the top of it",
	},
	{
		id: "docs",
		label: "Docs",
		icon: "book",
		blurb: "The parts a documentation page is made of",
	},
	{
		id: "3d",
		label: "3D",
		icon: "cube",
		blurb: "A model in a React component, and nothing else to configure",
	},
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
	/**
	 * What kind of thing this is in the library's hierarchy.
	 *
	 * A `component` is one thing with one job - a card, a button, a code slab.
	 * A `block` is an assembly of them that stands as a region of a page: the
	 * nav bar, the desktop shelf, the archive. The default is `component`,
	 * because most things are, and a block earns the label by being composed
	 * rather than by being large.
	 */
	readonly kind?: "component" | "block";
	/**
	 * Who may install this. `public` is the default and today the only value
	 * in use; `pro` is the blockade for a paid tier later - the registry
	 * endpoints refuse to serve a `pro` item's files, so the gate exists at
	 * the source of truth rather than in whichever page remembered to check.
	 */
	readonly access?: "public" | "pro";
	/**
	 * The element's own version, independent of the package's.
	 *
	 * A copied component has no lockfile entry, so this is the only version a
	 * consumer can ever cite. Bump it when the element's contract changes -
	 * the installers, the prompt documents and the archive all read it from
	 * here, which is what makes per-element releases possible later without
	 * inventing a second registry.
	 */
	readonly version: string;
}

/*
 * Versions are stated, not left to `latest`. A copied component is verified
 * against one version of its dependency, and pretending otherwise is how an
 * install works for the author and breaks for everyone else.
 */
export const REGISTRY_ITEMS: readonly RegistryItem[] = [
	{
		name: "reveal",
		version: "0.1.0",
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
		version: "0.1.0",
		title: "Smooth Scroll",
		description:
			"Mounts Lenis for the page and renders nothing. Respects reduced motion.",
		files: ["smooth-scroll.tsx"],
		dependencies: { lenis: "1.3.26" },
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "lenis"],
		preview: "Nothing to see - it changes how the page scrolls",
	},
	{
		name: "scroll-spin",
		version: "0.1.0",
		title: "Scroll Spin",
		description:
			"Rotates its children with the page scroll, in a rAF callback rather than React state.",
		files: ["scroll-spin.tsx", "use-scroll-turn.ts"],
		dependencies: {},
		registryDependencies: ["use-scroll-turn"],
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "transform", "no-deps"],
		preview: "A mark turning as the frame scrolls",
	},
	{
		name: "use-scroll-turn",
		version: "0.1.0",
		title: "useScrollTurn",
		description:
			"Scroll position as a rotation, delivered once per frame. Drives a CSS transform or a three.js object, never React state.",
		files: ["use-scroll-turn.ts"],
		dependencies: {},
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "hook", "no-deps"],
		preview: "No UI - it hands you an angle every frame",
	},
	{
		name: "archive",
		kind: "block",
		version: "0.1.0",
		title: "Archive",
		description:
			"A filterable grid with categories, subcategories and tags. Renders its own links through a callback so the router stays yours.",
		files: ["archive.tsx", "archive.schemas.ts"],
		dependencies: { zod: "^4.4.3" },
		registryDependencies: ["card"],
		category: "layout",
		subcategory: "Containers",
		tags: ["block", "grid", "filter", "schema"],
		preview: "A grid of cards above a row of category filters",
	},
	{
		name: "use-scroll-progress",
		version: "0.1.0",
		title: "useScrollProgress",
		description:
			"How far one element has travelled up the viewport, 0 to 1, once per frame. Gated by an observer so an off-screen element costs nothing.",
		files: ["use-scroll-progress.ts"],
		dependencies: {},
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "hook", "observer", "no-deps"],
		preview: "No UI - it hands you a number between 0 and 1",
	},
	{
		name: "device",
		kind: "block",
		version: "0.1.0",
		title: "Device",
		description:
			"A phone, a tablet or a laptop in CSS 3D, chosen by the stylesheet rather than by JavaScript, whose screen is a real scroll container with real controls in it.",
		files: ["device.tsx", "device-kinds.ts"],
		dependencies: {},
		category: "layout",
		subcategory: "Scenes",
		tags: ["block", "3d", "perspective", "responsive", "no-js", "no-deps"],
		preview: "The same screen drawn as all three machines",
	},
	{
		name: "use-device-kind",
		version: "0.1.0",
		title: "useDeviceKind",
		description:
			"Which machine the stylesheet is currently drawing, as a value. Null until mounted, on purpose - a default would be a claim the server cannot support.",
		files: ["use-device-kind.ts", "device-kinds.ts"],
		dependencies: {},
		registryDependencies: ["device"],
		category: "layout",
		subcategory: "Scenes",
		tags: ["responsive", "media-query", "ssr", "no-deps"],
		preview: "No UI - it names the machine you are looking at",
	},
	{
		name: "desk-window",
		kind: "block",
		version: "0.1.0",
		title: "Desk Window",
		description:
			"A window you can drag, close and stack. Position is written to the element during a drag and to state only on release.",
		files: ["desk-window.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Overlays",
		tags: ["block", "drag", "pointer", "touch", "no-deps"],
		preview: "Two windows on a desk, one dragged in front of the other",
	},
	{
		name: "dock",
		kind: "block",
		version: "0.1.0",
		title: "Dock",
		description:
			"A launcher, what is open, and a corner. Search opens upward and results are the consumer's to compute.",
		files: ["dock.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["block", "navigation", "search", "no-js", "no-deps"],
		preview: "A dock with a launcher open above it",
	},
	{
		name: "use-desk-state",
		version: "0.1.0",
		title: "useDeskState",
		description:
			"Which windows are open, where they sit and what has been put away, remembered without breaking a server render.",
		files: ["use-desk-state.ts"],
		dependencies: {},
		category: "layout",
		subcategory: "Overlays",
		tags: ["state", "storage", "ssr", "no-deps"],
		preview: "No UI - it remembers where you left things",
	},
	{
		name: "context-menu",
		kind: "block",
		version: "0.1.0",
		title: "Context Menu",
		description:
			"One menu, reachable by right-click, by long press, and by a button. Escape and arrow keys included.",
		files: ["context-menu.tsx", "icon.tsx"],
		// `react-dom` for `createPortal`. Stated rather than assumed: a React
		// project is not guaranteed to have react-dom, and this one does not
		// render without it.
		dependencies: { "react-dom": "^19.0.0" },
		category: "layout",
		subcategory: "Overlays",
		tags: ["block", "menu", "touch", "keyboard", "no-deps"],
		preview: "A menu opening at the pointer with four actions in it",
	},
	{
		name: "folder-shelf",
		kind: "block",
		version: "0.1.0",
		title: "Folder Shelf",
		description:
			"A desktop of folders that open into draggable windows, several at once, remembered between visits.",
		files: [
			"folder-shelf.tsx",
			"context-menu.tsx",
			"desk-window.tsx",
			"use-desk-state.ts",
			"icon.tsx",
		],
		dependencies: {},
		registryDependencies: ["context-menu", "desk-window", "use-desk-state"],
		category: "layout",
		subcategory: "Containers",
		tags: ["block", "dialog", "tree", "touch", "no-deps"],
		preview: "Folders on a desk with a window open over them",
	},
	{
		name: "boot-loader",
		kind: "block",
		version: "0.1.0",
		title: "Boot Loader",
		description:
			"A count to a hundred that stalls at ninety until what it is covering has actually arrived. Fills its parent, not the viewport.",
		files: ["boot-loader.tsx"],
		dependencies: {},
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["block", "loading", "raf", "a11y", "no-deps"],
		preview: "A mark, a number climbing, and a rule filling",
	},
	{
		name: "card",
		version: "0.1.0",
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
		version: "0.1.0",
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
		version: "0.1.0",
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
		version: "0.1.0",
		title: "Showcase",
		description:
			"A component in a real iframe at every width it has to survive, side by side, with its source and install commands.",
		files: ["showcase.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Presentation",
		tags: ["iframe", "responsive"],
		preview: "One component, four real viewports, side by side",
	},
	{
		name: "clock",
		version: "0.1.0",
		title: "Clock",
		description:
			"The reader's own day and time, in the reader's own zone, without asking anybody for a location.",
		files: ["clock.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Rendering",
		tags: ["intl", "ssr", "no-deps"],
		preview: "A weekday and a local time, ticking",
	},
	{
		name: "credit",
		version: "0.1.0",
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
		version: "0.1.0",
		title: "Markdown View",
		description:
			"Renders Markdown with callouts, CSS-only tabs, custom blocks and highlighted code.",
		files: ["markdown-view.tsx", "markdown-blocks.tsx"],
		dependencies: {
			"@tanstack/markdown": "0.0.13",
		},
		registryDependencies: ["code-block", "reference"],
		category: "content",
		subcategory: "Rendering",
		tags: ["markdown", "highlight", "ssr"],
		preview: "Markdown with callouts, tabs and highlighted code",
	},
	{
		name: "code-block",
		version: "0.1.0",
		title: "Code Block",
		description:
			"A highlighted code slab with the CLI's colours, a lit top edge, and a copy button that confirms in place.",
		files: ["code-block.tsx", "highlighter.ts"],
		dependencies: {
			"@tanstack/highlight": "0.0.10",
		},
		registryDependencies: ["copy-button"],
		category: "content",
		subcategory: "Rendering",
		tags: ["code", "highlight", "copy", "ssr"],
		preview: "Highlighted code with a copy button",
	},
	{
		name: "copy-button",
		version: "0.1.0",
		title: "Copy Button",
		description:
			"A glass chip that writes to the clipboard and confirms in the button itself, then hands back.",
		files: ["copy-button.tsx", "icon.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Rendering",
		tags: ["clipboard", "button"],
		preview: "Copy, with the confirmation in the button",
	},
	{
		name: "breadcrumb",
		version: "0.1.0",
		title: "Breadcrumb",
		description:
			"The trail, told twice from one list: a visible nav with correct ARIA, and the schema.org BreadcrumbList rendered from the same array.",
		files: ["breadcrumb.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Navigation",
		tags: ["navigation", "seo", "json-ld", "no-deps"],
		preview: "A trail of crumbs with a chevron between each",
	},
	{
		name: "command-palette",
		version: "0.1.0",
		title: "Command Palette",
		description:
			"Search over everything the host can name, in a native dialog: substring filter, arrow keys, and the host keeps the router.",
		files: ["command-palette.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Navigation",
		tags: ["search", "keyboard", "dialog", "no-deps"],
		preview: "A search field over a filtered list, floating mid-page",
	},
	{
		name: "pagination",
		version: "0.1.0",
		title: "Pagination",
		description:
			"Pages as links with first and last always reachable. The window everyone already knows, and nothing that breaks middle-click.",
		files: ["pagination.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Navigation",
		tags: ["navigation", "no-deps"],
		preview: "Numbered pages with an ellipsis where numbers were elided",
	},
	{
		name: "typography",
		version: "0.1.0",
		title: "Typography",
		description:
			"The type scale as components: Heading with outline and size separated, the Label eyebrow, the Lead. One decision, made once.",
		files: ["typography.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Text",
		tags: ["typography", "headings", "no-deps"],
		preview: "A label, a heading and a lead, in the site's own scale",
	},
	{
		name: "reference",
		version: "0.1.0",
		title: "Reference",
		description:
			"An inline mention that carries a hover card: title, summary and meta for the thing it names, raised by CSS alone.",
		files: ["reference.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Rendering",
		tags: ["hover", "link", "docs"],
		preview: "A mention with a hover card",
	},
	{
		name: "grid",
		version: "0.1.0",
		title: "Grid",
		description:
			"A responsive grid with no breakpoints in it. One number decides the column count at every width.",
		files: ["grid.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["grid", "responsive", "no-deps"],
		preview: "Cards reflowing from four columns to one",
	},
	{
		name: "theme-toggle",
		version: "0.1.0",
		title: "Theme Toggle",
		description:
			"A segmented control that reports which option was pressed and knows nothing about themes. Roving focus, and `aria-checked` is the selector that draws it.",
		files: ["theme-toggle.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["a11y", "keyboard", "ssr", "no-deps"],
		preview: "Three icons in a well, one lit",
	},
	{
		name: "spacer",
		version: "0.1.0",
		title: "Spacer",
		description:
			"Vertical space on the scale, optionally with a rule and a label. For Markdown, where there is no markup to hang a margin on.",
		files: ["spacer.tsx", "grid.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["markdown", "spacing", "no-deps"],
		preview: "A labelled rule holding a gap open",
	},
	{
		name: "nav-bar",
		kind: "block",
		version: "0.1.0",
		title: "Nav Bar",
		description:
			"A site header whose panels expand. Built on <details>, so it works before hydration and closes on Escape.",
		files: ["nav-bar.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["block", "navigation", "no-js", "responsive"],
		preview: "A header with a panel of categories open under it",
	},
	{
		name: "frontmatter",
		version: "0.1.0",
		title: "Frontmatter",
		description:
			"A small frontmatter reader for `key: value` and inline lists. Not YAML, deliberately.",
		files: ["frontmatter.ts"],
		dependencies: {},
		category: "content",
		subcategory: "Parsing",
		tags: ["markdown", "no-deps"],
		preview: "No UI - it reads the metadata block off a file",
	},
];
