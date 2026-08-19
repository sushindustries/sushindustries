import {
	renderLlmsIndex,
	renderPageDocument,
	renderSectionIndex,
} from "@sushindustries/llms";
import { markdown, notFoundMarkdown } from "../registry/agent-setup.server";
import { originFrom } from "../registry/registry.server";
import { findDemoSource, hasDemo } from "../showcase/demo-sources";
import { findComponentPage } from "./components/component-page";
import { describeSite } from "./llms.server";
import { siteSections } from "./site-index";

/*
 * Every page, as the Markdown it is made of, addressed as `<path>/index.md`.
 *
 * The HTML page and its Markdown mirror live at the same path, so a reader
 * that wants the text appends `index.md` and gets it - no scraping and no
 * second index to learn. The content comes from
 * the same site index and component pages the HTML renders from, so the two
 * surfaces cannot disagree about what a page says.
 *
 * `.server.ts` because it is only ever called from a route handler. Nothing
 * here is privileged; the suffix keeps request-shaped code out of components.
 */

/*
 * A section's root path is its entries' shared first segment - derived, not
 * declared, so a section added to the index gets its listing for free.
 */
function sectionRoot(entryPath: string): string {
	return `/${entryPath.split("/")[1] ?? ""}`;
}

function componentMarkdown(origin: string, name: string): string | undefined {
	const doc = findComponentPage(
		name,
		hasDemo,
		(id) => findDemoSource(id)?.source,
	);
	if (!doc) return undefined;

	const body = doc.sections
		.flatMap((section) =>
			doc.sections.length > 1
				? [`## ${section.label}`, "", section.body, ""]
				: [section.body, ""],
		)
		.join("\n");

	return renderPageDocument(describeSite(origin), {
		path: `/components/${name}`,
		title: doc.title,
		description: doc.summary,
		body,
	});
}

/**
 * The page at `path` as Markdown, or undefined when no page lives there.
 *
 * The home page mirrors the llms.txt index, a section root mirrors its
 * listing, and an entry page mirrors its own text.
 */
export function pageMarkdown(origin: string, path: string): string | undefined {
	const site = describeSite(origin);

	if (path === "/") return renderLlmsIndex(site);

	/*
	 * Component pages go through the same assembly the HTML page uses, so the
	 * mirror carries the generated sections - the demo source, the API table -
	 * and not just the hand-written half the site index holds.
	 */
	const component = /^\/components\/([^/]+)$/.exec(path);
	if (component?.[1]) return componentMarkdown(origin, component[1]);

	for (const section of siteSections()) {
		const first = section.entries[0];
		if (first && path === sectionRoot(first.path)) {
			return renderSectionIndex(site, section);
		}

		const entry = section.entries.find((candidate) => candidate.path === path);
		if (entry) {
			return renderPageDocument(site, {
				...entry,
				body: entry.body ?? entry.description,
			});
		}
	}

	return undefined;
}

/** The whole `index.md` handler, so each route is one line of intent. */
export function pageMarkdownResponse(request: Request, path: string): Response {
	const body = pageMarkdown(originFrom(request), path);

	return body ? markdown(body) : notFoundMarkdown(`No page at "${path}".`);
}
