/*
 * The words this library is allowed to describe itself with.
 *
 * `category` was typed and `subcategory` and `tags` were free strings, which
 * is the difference between a vocabulary and a habit. Measuring it made the
 * cost visible: eighty nine distinct tags across seventy three items, fifty
 * nine of them used exactly once, and two pairs that are the same concept
 * spelled twice - `filter`/`filtering` and `heading`/`headings`.
 *
 * A tag that exists twice under two spellings is worse than a missing tag. The
 * filter still works, still returns rows, and silently returns half of them.
 * Nothing errors and nothing looks wrong.
 *
 * So the set is closed. Adding a word means adding it here, which is a line of
 * thought rather than a line of typing - and `pnpm run doctor` rejects an item
 * using one that is not declared.
 *
 * Kept in the package rather than in the site, like the registry itself: the
 * package is what gets installed, and an installer reading `tags` deserves to
 * know what the words mean.
 */

/*
 * Coarse groups, chosen so every item lands in exactly one. An item that
 * plausibly fits two means the groups are wrong, not that it needs a second.
 */
export type RegistryCategory = "motion" | "layout" | "content" | "docs" | "3d";

/**
 * A finer grouping inside a category. For reading, not filtering.
 *
 * Each declares the category it sits under, which is the constraint that keeps
 * this from becoming a second flat list: "Overlays" under `layout` and
 * "Overlays" under `content` would be two different ideas sharing a word.
 */
export interface Subcategory {
	readonly name: string;
	readonly category: RegistryCategory;

	/** One line. What belongs here, and what does not. */
	readonly about: string;
}

/**
 * @public
 *
 * Read by `pnpm run doctor` textually rather than imported, which is why knip
 * cannot see a consumer: the doctor is plain Node with nothing between it and
 * the filesystem, so it parses this file instead of importing a `.ts` it would
 * need a build to load. The `@public` tag is how knip is told that.
 */
export const SUBCATEGORIES: readonly Subcategory[] = [
	{
		name: "Scroll effects",
		category: "motion",
		about: "Things that respond to scroll position, all reduced-motion aware.",
	},
	{
		name: "Text effects",
		category: "motion",
		about: "Type that animates. Never at the cost of the words being readable.",
	},
	{
		name: "Containers",
		category: "layout",
		about: "Surfaces that hold other things: cards, panels, frames, machines.",
	},
	{
		name: "Overlays",
		category: "layout",
		about: "Anything drawn over the page: dialogs, menus, sheets, popovers.",
	},
	{
		name: "Page structure",
		category: "layout",
		about: "The regions a page is assembled from - grids, sections, spacing.",
	},
	{
		name: "Page furniture",
		category: "layout",
		about: "The parts that are the same on every page: the nav, the footer.",
	},
	{
		name: "Scenes",
		category: "layout",
		about: "A framed world with its own coordinates: a device, a desktop.",
	},
	{
		name: "Forms",
		category: "content",
		about: "Controls somebody types or chooses with, and their labels.",
	},
	{
		name: "Actions",
		category: "content",
		about: "Things pressed: buttons, toggles, the controls that do something.",
	},
	{
		name: "Data",
		category: "content",
		about: "Rows and numbers, and the tables and charts that show them.",
	},
	{
		name: "Feedback",
		category: "content",
		about: "What the interface says back: alerts, toasts, progress, empties.",
	},
	{
		name: "Loading",
		category: "content",
		about: "The shapes shown while something is not there yet.",
	},
	{
		name: "Media",
		category: "content",
		about: "Images, video, and the frames they sit in.",
	},
	{
		name: "Text",
		category: "content",
		about: "Type as a component: headings, leads, labels, inline marks.",
	},
	{
		name: "Rendering",
		category: "content",
		about: "Turning authored content into elements. Markdown, code, blocks.",
	},
	{
		name: "Parsing",
		category: "content",
		about: "Reading structure out of text before anything renders it.",
	},
	{
		name: "Primitives",
		category: "content",
		about: "The smallest pieces, with no opinion about where they are used.",
	},
	{
		name: "Presentation",
		category: "content",
		about: "How a thing is shown rather than what it is: themes, variants.",
	},
	{
		name: "Disclosure",
		category: "content",
		about: "Content that opens: accordions, collapsibles, details.",
	},
	{
		name: "Navigation",
		category: "docs",
		about: "Getting between pages: breadcrumbs, pagination, palettes, trails.",
	},
	{
		name: "Documents",
		category: "docs",
		about: "The parts a documentation page is assembled from.",
	},
	{
		name: "Attribution",
		category: "docs",
		about: "Saying where something came from, and who made it.",
	},
];

/**
 * A cross-cutting label. These are the ones people filter by.
 *
 * Every tag carries what it claims, because the useful ones are claims rather
 * than topics: `no-deps` says something checkable about the install, `ssr`
 * says something checkable about the first render. A tag that only restates
 * the category earns nothing and is the kind this list exists to keep out.
 */
export interface Tag {
	readonly name: string;
	readonly about: string;
}

/**
 * @public
 *
 * Read textually by the doctor, like `SUBCATEGORIES` above.
 */
export const TAGS: readonly Tag[] = [
	/* ── what it costs to install ─────────────────────────────────── */
	{
		name: "no-deps",
		about: "Installs with no runtime dependency beyond React.",
	},
	{
		name: "tanstack",
		about: "Built on a TanStack library, which comes with it.",
	},
	{ name: "lenis", about: "Needs Lenis, the smooth-scroll driver." },

	/* ── what it does without JavaScript ──────────────────────────── */
	{ name: "no-js", about: "Works with scripting off. Not degraded - works." },
	{ name: "ssr", about: "Renders correctly on the first server pass." },
	{
		name: "css-only",
		about: "The behaviour is CSS. There is no script to load.",
	},

	/* ── how it is reached ────────────────────────────────────────── */
	{ name: "keyboard", about: "Fully operable without a pointer." },
	{
		name: "touch",
		about: "Handles touch as a first input, not as a fallback.",
	},
	{ name: "pointer", about: "Positions itself at the pointer." },
	{
		name: "a11y",
		about: "Carries a specific accessibility guarantee worth citing.",
	},
	{ name: "hover", about: "Something meaningful happens on hover." },

	/* ── what shape it is ─────────────────────────────────────────── */
	{ name: "block", about: "An assembly of components, not one component." },
	{ name: "hook", about: "A hook. Renders nothing itself." },
	{ name: "surface", about: "Something other things are drawn on." },
	{ name: "panel", about: "A bounded region with its own edge." },
	{ name: "shell", about: "A frame around a whole application surface." },
	{ name: "grid", about: "Lays its children out in two dimensions." },
	{ name: "list", about: "An ordered or unordered sequence." },
	{ name: "row", about: "Lays its children out along one axis." },
	{ name: "tree", about: "Nested, and navigable by that nesting." },
	{ name: "divider", about: "Separates without containing." },
	{ name: "group", about: "Several controls that behave as one." },

	/* ── what it is for ───────────────────────────────────────────── */
	{ name: "form", about: "Part of somebody entering data." },
	{ name: "button", about: "Pressed to do something." },
	{ name: "toggle", about: "Two states, switched between." },
	{ name: "label", about: "Names another control." },
	{ name: "menu", about: "A list of actions, opened." },
	{ name: "dialog", about: "Interrupts, and has to be dismissed." },
	{ name: "modal", about: "Makes the page behind inert." },
	{ name: "drawer", about: "Slides in from an edge." },
	{ name: "popover", about: "Uses the popover API and the top layer." },
	{ name: "navigation", about: "Moves between pages or sections." },
	{ name: "pagination", about: "Moves between pages of one list." },
	{ name: "search", about: "Narrows a set by what somebody typed." },
	{ name: "filter", about: "Narrows a set by a chosen value." },
	{ name: "sorting", about: "Reorders a set by a chosen column." },
	{ name: "data", about: "Shows rows or numbers." },
	{ name: "chart", about: "Draws data as a shape." },
	{ name: "loading", about: "Stands in for content that has not arrived." },
	{ name: "empty-state", about: "What is shown when there is nothing." },
	{ name: "notification", about: "Tells somebody something happened." },
	{ name: "callout", about: "Sets a passage apart from the prose around it." },
	{ name: "details", about: "Built on the `<details>` element." },
	{ name: "disclosure", about: "Opens to reveal more." },

	/* ── what it renders ──────────────────────────────────────────── */
	{ name: "markdown", about: "Renders authored Markdown." },
	{ name: "code", about: "Shows source." },
	{ name: "highlight", about: "Colours syntax, at build time." },
	{ name: "typography", about: "Type as a component rather than as a style." },
	{ name: "heading", about: "Is, or produces, a heading in the outline." },
	{ name: "image", about: "Shows a raster or vector image." },
	{ name: "video", about: "Plays video." },
	{ name: "media", about: "Images or video, framed." },
	{ name: "svg", about: "Draws SVG directly." },
	{ name: "icons", about: "Draws from the shared icon set." },
	{ name: "link", about: "Navigates. The host supplies the router." },

	/* ── how it behaves ───────────────────────────────────────────── */
	{ name: "scroll", about: "Reads or drives scroll position." },
	{ name: "responsive", about: "Changes shape with the space it is given." },
	{
		name: "container-query",
		about: "Responds to its container, not the window.",
	},
	{ name: "media-query", about: "Responds to the viewport." },
	{ name: "intersection", about: "Uses IntersectionObserver." },
	{ name: "observer", about: "Watches something and reacts." },
	{ name: "raf", about: "Runs work per frame rather than per render." },
	{ name: "transform", about: "Moves or rotates without reflowing." },
	{ name: "perspective", about: "Draws in 3D space." },
	{ name: "drag", about: "Can be dragged." },
	{ name: "state", about: "Owns state a caller can read." },
	{ name: "storage", about: "Remembers something between visits." },
	{
		name: "facade",
		about: "Stands in for something heavy until it is needed.",
	},
	{ name: "fallback", about: "What is shown when the real thing cannot load." },
	{ name: "generated", about: "Its content is written by a build step." },
	{ name: "theme-aware", about: "Reads the theme rather than being told it." },
	{ name: "tone", about: "Takes a colour family as a prop." },
	{ name: "spacing", about: "Its job is the distance between things." },
	{ name: "clipboard", about: "Writes to the clipboard." },
	{ name: "copy", about: "Offers something to copy." },
	{ name: "iframe", about: "Embeds a third-party frame." },
	{ name: "intl", about: "Formats for a locale." },
	{ name: "type", about: "Carries type information a consumer uses." },

	/* ── what it is about ─────────────────────────────────────────── */
	{ name: "3d", about: "Renders a three-dimensional scene." },
	{ name: "docs", about: "Part of a documentation page specifically." },
	{ name: "seo", about: "Affects what a crawler sees." },
	{ name: "json-ld", about: "Emits structured data." },
	{ name: "schema", about: "Declares or validates a shape." },
	{ name: "privacy", about: "Touches visitor data, and says how." },
	{ name: "gdpr", about: "Exists because of a specific legal requirement." },
	{ name: "analytics", about: "Reports usage somewhere." },
	{ name: "assistant", about: "Part of the assistant surface." },
	{ name: "action", about: "Performs a side effect when used." },
];
