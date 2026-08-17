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
	/**
	 * The schema.org class this element expresses.
	 *
	 * Not a label: it is the type the element's page publishes as JSON-LD and
	 * the type its row carries in `things`, so a breadcrumb is a
	 * `BreadcrumbList`, an archive is a `CollectionPage`, and a control that
	 * expresses no content of its own is the honest answer - the source code
	 * you install.
	 *
	 * Typed as `string` rather than pulled from `@sushindustries/db` on
	 * purpose: this package has no dependencies and is not about to take one
	 * for a string. `pnpm doctor` checks every value against the generated
	 * vocabulary, so a class that does not exist fails at the gate instead.
	 */
	readonly schema: string;
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
		schema: "SoftwareSourceCode",
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
		name: "typed-mark",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Typed Mark",
		description:
			"Types a word out one character at a time, cycling the syntax palette. No JavaScript, no state, and it runs with scripting off.",
		files: ["typed-mark.tsx"],
		dependencies: {},
		category: "motion",
		subcategory: "Text effects",
		tags: ["type", "css-only", "no-js", "a11y", "no-deps"],
		preview: "A name typing itself in nine colours",
	},
	{
		name: "smooth-scroll",
		schema: "SoftwareSourceCode",
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
		schema: "SoftwareSourceCode",
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
		schema: "SoftwareSourceCode",
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
		schema: "CollectionPage",
		kind: "block",
		version: "0.1.1",
		title: "Archive",
		description:
			"A filterable grid with categories, subcategories and tags. Renders its own links through a callback so the router stays yours.",
		files: ["archive.tsx", "archive.schemas.ts", "pagination.tsx", "icon.tsx"],
		dependencies: { zod: "^4.4.3" },
		registryDependencies: ["card"],
		category: "layout",
		subcategory: "Containers",
		tags: ["block", "grid", "filter", "schema"],
		preview: "A grid of cards above a row of category filters",
	},
	{
		name: "use-scroll-progress",
		schema: "SoftwareSourceCode",
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
		schema: "SoftwareSourceCode",
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
		schema: "SoftwareSourceCode",
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
		schema: "SoftwareSourceCode",
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
		schema: "SiteNavigationElement",
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
		schema: "SoftwareSourceCode",
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
		schema: "SiteNavigationElement",
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
		schema: "ItemList",
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
		schema: "SoftwareSourceCode",
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
		name: "questions",
		schema: "ItemList",
		version: "0.1.0",
		title: "Questions",
		description:
			"The questions a page expects to be asked. Given an onAsk, each one is a button that puts itself to an assistant; without it, a plain list.",
		files: ["questions.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Documents",
		tags: ["assistant", "no-deps"],
		preview: "Three questions, pressable",
	},
	{
		name: "card",
		schema: "CreativeWork",
		version: "0.1.0",
		title: "Card",
		description:
			"Title, optional meta, arbitrary body. Heading level is a prop so the outline stays correct.",
		files: ["card.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Containers",
		tags: ["surface", "no-deps"],
		preview: "Two cards: one with meta, one as a link",
	},
	{
		name: "section",
		schema: "WebPageElement",
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
		schema: "SiteNavigationElement",
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
		name: "hero",
		schema: "WPHeader",
		version: "0.1.0",
		title: "Hero",
		description:
			"The head of a documentation page: trail, element name, version, measured facts, actions and a responsive shot. Folds to one column by the room it has, not by the size of the window.",
		files: ["hero.tsx", "icon.tsx"],
		dependencies: {},
		category: "docs",
		subcategory: "Page furniture",
		tags: ["container-query", "responsive", "no-deps"],
		preview: "A page head with its name, its facts and a picture of itself",
		kind: "block",
	},
	{
		name: "showcase",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Showcase",
		description:
			"A component in a real iframe at every width it has to survive, side by side, with its source and install commands.",
		files: ["showcase.tsx", "icon.tsx"],
		dependencies: {},
		registryDependencies: ["copy-button"],
		category: "docs",
		subcategory: "Presentation",
		tags: ["iframe", "responsive"],
		preview: "One component, four real viewports, side by side",
	},
	{
		name: "clock",
		schema: "SoftwareSourceCode",
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
		schema: "Person",
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
		schema: "Article",
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
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Code Block",
		description:
			"A highlighted code slab with the CLI's colours, a lit top edge, and a copy button that confirms in place.",
		files: ["code-block.tsx", "highlighter.ts", "icon.tsx"],
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
		schema: "SoftwareSourceCode",
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
		schema: "BreadcrumbList",
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
		schema: "SiteNavigationElement",
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
		schema: "SiteNavigationElement",
		version: "0.1.1",
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
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Typography",
		description:
			"The type scale as components: Heading with outline and size separated, the Label eyebrow, the Lead. One decision, made once.",
		/*
		 * Ships `icon.tsx` because `Label` takes an optional glyph. Installing
		 * typography without it would copy a file whose first import cannot
		 * resolve, which works here only because the file exists here.
		 */
		files: ["typography.tsx", "icon.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Text",
		tags: ["typography", "headings", "no-deps"],
		preview: "A label, a heading and a lead, in the site's own scale",
	},
	{
		name: "badge",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Badge",
		description:
			"A word wearing a fill, in the site's own tone pairs - a badge invents no colour of its own.",
		files: ["badge.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Text",
		tags: ["label", "tone", "no-deps"],
		preview: "Words on pastel fills, one per tone",
	},
	{
		name: "kbd",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Kbd",
		description:
			"A key, drawn as one. Semantically <kbd>, visually the chip the command palette already wears.",
		files: ["kbd.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Text",
		tags: ["keyboard", "no-deps"],
		preview: "Esc and \u2318K, drawn as keys",
	},
	{
		name: "separator",
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Separator",
		description:
			"A rule with two directions and an accessibility decision: announced when it separates content, silent when it is furniture.",
		files: ["separator.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["divider", "no-deps"],
		preview: "A horizontal rule and a vertical one, holding things apart",
	},
	{
		name: "skeleton",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Skeleton",
		description:
			"The wait, drawn as the thing being waited for: a line, a block or a circle, shimmering unless motion is reduced.",
		files: ["skeleton.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Loading",
		tags: ["loading", "no-deps"],
		preview: "Three placeholder shapes, sweeping",
	},
	{
		name: "spinner",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Spinner",
		description:
			"One ring, one border, one turn - with a visually hidden label, because a spinner with nothing to announce is just an animation.",
		files: ["spinner.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Loading",
		tags: ["loading", "no-deps"],
		preview: "A ring turning beside its label",
	},
	{
		name: "avatar",
		schema: "Person",
		version: "0.1.0",
		title: "Avatar",
		description:
			"A person at glyph size: the image if it loads, initials on a toned fill if it does not.",
		files: ["avatar.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Media",
		tags: ["image", "fallback", "no-deps"],
		preview: "A photo and two initials, side by side",
	},
	{
		name: "aspect-ratio",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Aspect Ratio",
		description:
			"A box that keeps its shape and fills whatever is put in it. CSS aspect-ratio, as a prop.",
		files: ["aspect-ratio.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Page structure",
		tags: ["media", "no-deps"],
		preview: "A 16:9 frame holding an image to its crop",
	},
	{
		name: "button",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Button",
		description:
			"The pill and the ghost - one action and its alternative, with no third variant on purpose.",
		files: ["button.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Actions",
		tags: ["action", "no-deps"],
		preview: "A filled pill beside a ghost outline",
	},
	{
		name: "empty",
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Empty",
		description:
			"Nothing, said properly: what is missing, why that is fine, and what to do next - in that order, quietly.",
		files: ["empty.tsx", "icon.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Loading",
		tags: ["empty-state", "no-deps"],
		preview: "A dashed frame with an icon and a way out",
	},
	{
		name: "item",
		schema: "ListItem",
		version: "0.1.0",
		title: "Item",
		description:
			"One row of a list: tile, title, description, meta - the nav panel's anatomy, extracted for reuse.",
		files: ["item.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Containers",
		tags: ["list", "row", "no-deps"],
		preview: "Rows with toned tiles and right-aligned meta",
	},
	{
		name: "input",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Input",
		description:
			"A text input, and only the drawing of one - state and labels belong to the form and to Field.",
		files: ["input.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "A text field wearing the site's focus ring",
	},
	{
		name: "textarea",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Textarea",
		description:
			"A textarea in the same clothes as Input, growing with its content where the browser allows.",
		files: ["textarea.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "A paragraph-sized field",
	},
	{
		name: "field",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Field",
		description:
			"A labelled control with one line under it - the error is announced by being pointed at, not by being red.",
		files: ["field.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "label", "a11y", "no-deps"],
		preview: "Label, control, hint - and the error state",
	},
	{
		name: "checkbox",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Checkbox",
		description:
			"A native checkbox with its words attached, painted by accent-color rather than redrawn.",
		files: ["checkbox.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "A checked box in the accent",
	},
	{
		name: "radio-group",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Radio Group",
		description:
			"Radios in a fieldset - the one grouping screen readers announce without help.",
		files: ["radio-group.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "Three options, one chosen",
	},
	{
		name: "switch",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Switch",
		description:
			"A checkbox that admits it: a real input with role=switch, and a track :checked drives.",
		files: ["switch.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "toggle", "no-deps"],
		preview: "A thumb sliding along its track",
	},
	{
		name: "native-select",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Native Select",
		description:
			"The platform's own select in the site's clothes - the phone wheel and the OS menu, kept.",
		files: ["native-select.tsx", "icon.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "A select with the chevron put back",
	},
	{
		name: "slider",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Slider",
		description:
			"A native range input with its label - keyboard steps and form value ship in the element.",
		files: ["slider.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Forms",
		tags: ["form", "no-deps"],
		preview: "A range track in the accent",
	},
	{
		name: "progress",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Progress",
		description:
			"The native progress element, restyled - omit value and the indeterminate state is real.",
		files: ["progress.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Loading",
		tags: ["loading", "form", "no-deps"],
		preview: "A bar part- filled in the accent",
	},
	{
		name: "accordion",
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Accordion",
		description:
			"details, stacked - every behaviour ships in the element, and items open independently on purpose.",
		files: ["accordion.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Disclosure",
		tags: ["details", "no-deps"],
		preview: "Three rows, one open, chevrons turning",
	},
	{
		name: "collapsible",
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Collapsible",
		description:
			"One details, dressed - a sentence that opens, for prose rather than lists.",
		files: ["collapsible.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Disclosure",
		tags: ["details", "no-deps"],
		preview: "A line that opens into a paragraph",
	},
	{
		name: "alert",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Alert",
		description:
			"The Markdown callout, reachable from JSX - application news in the same box the docs already use.",
		files: ["alert.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Feedback",
		tags: ["callout", "no-deps"],
		preview: "A note, a tip and a caution in their tints",
	},
	{
		name: "tooltip",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Tooltip",
		description:
			"One line on hover and focus, in the markup rather than in title= - and never carrying controls.",
		files: ["tooltip.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Feedback",
		tags: ["hover", "no-deps"],
		preview: "A word with its one-line answer above it",
	},
	{
		name: "toggle",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Toggle",
		description:
			"A button that stays down, and the single-select group of them - aria-pressed is the whole contract.",
		files: ["toggle.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Actions",
		tags: ["button", "group", "no-deps"],
		preview: "A pressed toggle in a group of three",
	},
	{
		name: "table",
		schema: "Table",
		version: "0.1.0",
		title: "Table",
		description:
			"A table that is a table: declared columns, right-aligned numbers, sideways scroll in its own frame.",
		files: ["table.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Data",
		tags: ["data", "no-deps"],
		preview: "Headers, rows and tabular numbers",
	},
	{
		name: "scroll-area",
		schema: "WebPageElement",
		version: "0.1.0",
		title: "Scroll Area",
		description:
			"The named inner scroll: thin bar, and the smooth scroller handed back - the pair everyone forgets separately.",
		files: ["scroll-area.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Containers",
		tags: ["scroll", "lenis", "no-deps"],
		preview: "A list scrolling inside its frame",
	},
	{
		name: "dialog",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Dialog",
		description:
			"A native dialog driven by props: top layer, focus trap and Escape from the element, click-outside from here.",
		files: ["dialog.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Overlays",
		tags: ["modal", "no-deps"],
		preview: "A titled box over a dimmed page",
	},
	{
		name: "sheet",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Sheet",
		description:
			"The dialog docked to an edge, for content tall enough that centring it would mean scrolling a floating box.",
		files: ["sheet.tsx", "icon.tsx"],
		dependencies: {},
		category: "layout",
		subcategory: "Overlays",
		tags: ["modal", "drawer", "no-deps"],
		preview: "A panel sliding in from the right",
	},
	{
		name: "toast",
		schema: "SoftwareSourceCode",
		version: "0.1.0",
		title: "Toast",
		description:
			"Strings, four seconds, bottom corner, announced politely - one provider and one hook, nothing else.",
		files: ["toast.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Feedback",
		tags: ["notification", "no-deps"],
		preview: "A message rising in the corner",
	},
	{
		name: "reference",
		schema: "DefinedTerm",
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
		schema: "ItemList",
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
		schema: "SoftwareSourceCode",
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
		schema: "WebPageElement",
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
		schema: "SiteNavigationElement",
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
		name: "video-player",
		schema: "VideoObject",
		version: "0.1.0",
		title: "Video Player",
		description:
			"A video held behind a picture of itself. The player is a child, so it mounts on play and unmounts on stop - no vendor, no bytes and no cookies until somebody asks.",
		files: ["video-player.tsx", "icon.tsx"],
		dependencies: {},
		category: "content",
		subcategory: "Media",
		tags: ["video", "facade", "privacy", "no-deps"],
		preview: "A poster with a play button, and the frame it reserves",
	},
	{
		name: "frontmatter",
		schema: "SoftwareSourceCode",
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
