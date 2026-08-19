import type { IconName } from "@sushindustries/ui";

/*
 * What the studio is made of, as data.
 *
 * The nav, the hub on the home page, and the `/api/v1/studio` description all
 * read this array. Before it, the tabs were a literal in the layout and the
 * endpoint list was a literal in the route, and the two had already started to
 * disagree - a section added to one was not in the other, and nothing said so.
 *
 * Adding a section is a line here plus a route file. Nothing else.
 *
 * The shape is deliberately thin: what it is called, where it lives, and one
 * sentence about what it answers. Anything a section needs beyond that belongs
 * to the section, not to a table describing all of them - a registry that
 * grows a field per feature is a registry every feature has to be edited into.
 *
 * `.ts` rather than `.catalogue.ts`: it is authored, not globbed. Client-safe,
 * because the nav renders on both sides.
 */

export interface StudioSection {
	/**
	 * The full route path, written out rather than composed.
	 *
	 * `/studio/${section}` is the tidier version and does not type-check: the
	 * router's `to` takes a literal from the generated route tree, and a
	 * template string is `/studio/${string}`, which matches routes that do not
	 * exist. Writing it in full means a section pointing at a route nobody
	 * created is a compile error rather than a 404 somebody finds later.
	 */
	readonly to:
		| "/studio/documents"
		| "/studio/collections"
		| "/studio/workflows"
		| "/studio/insights";

	/** The last segment, for keys and for the API description. */
	readonly path: string;

	/** In the nav and on the hub card. */
	readonly title: string;

	/** One sentence: the question this section answers. */
	readonly about: string;

	readonly icon: IconName;

	/**
	 * Off until the section exists and does something.
	 *
	 * A nav entry that leads to a page saying "coming soon" is worse than no
	 * entry - it is a promise with no date on it. Setting this true is the last
	 * step of building a section, not the first.
	 */
	readonly ready: boolean;
}

export const STUDIO_SECTIONS: readonly StudioSection[] = [
	{
		to: "/studio/documents",
		path: "documents",
		title: "Documents",
		about:
			"Every Markdown file and source file in the repository. Search them, read them, change what they are called, and edit what they say.",
		icon: "file",
		ready: true,
	},
	{
		to: "/studio/collections",
		path: "collections",
		title: "Collections",
		about:
			"Named sets of documents, each one a saved filter rather than a list - so anything added later that matches joins on its own.",
		icon: "folder",
		ready: true,
	},
	{
		to: "/studio/workflows",
		path: "workflows",
		title: "Workflows",
		about:
			"Sync the index, regenerate the schema, refresh the reference mirrors. The commands that used to only exist in a terminal.",
		icon: "terminal",
		ready: true,
	},
	{
		to: "/studio/insights",
		path: "insights",
		title: "Insights",
		about:
			"What the index costs to read, what people open, and how far behind the repository it is.",
		icon: "layers",
		ready: true,
	},
];

/** Sections a visitor should be shown. */
export const readySections = () => STUDIO_SECTIONS.filter((one) => one.ready);
