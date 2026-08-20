import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { loadComponentDoc } from "../../modules/content/components/component-doc";
import { seo } from "../../modules/content/seo";
import {
	componentSourceCode,
	ldScript,
} from "../../modules/content/structured-data";
import { hasDemo } from "../../modules/showcase/demo-sources";

/*
 * One component, opened at its first section.
 *
 * The other sections are `/components/<slug>/<section>` next door. They were
 * `?tab=<section>` for a while, on the reasoning that five sections are tabs
 * of one page - and they are five documents, each with its own title, its own
 * prose and its own row in the projection. A crawler reads a query string as a
 * variant of one page rather than as five, so four fifths of this
 * documentation was invisible to anything that indexes by URL.
 *
 * `index` keeps the bare path. It is the section you get by asking for the
 * component, and giving it a segment as well would be one page at two
 * addresses.
 *
 * This file is the layout rather than a page: it loads the document once and
 * renders whichever child matched. It had a component of its own and no
 * `Outlet`, which is why every section URL rendered the overview - the child
 * route matched, and nothing on screen came from it.
 *
 * There is deliberately no redirect from the old `?tab=` form. An unknown
 * search param is ignored, so an old link still opens the component at its
 * overview rather than failing - it lands on the page and not on the section,
 * which is the cost of not carrying a compatibility branch forever.
 */
export const Route = createFileRoute("/components/$slug")({
	component: Outlet,

	loader: ({ params }) => {
		const found = loadComponentDoc(params.slug);
		if (!found) throw notFound();
		return found;
	},

	head: ({ loaderData, params }) => ({
		// The element's own capture as the social image: a link to a component
		// unfurls as that component, not as the site mark.
		...seo({
			notFound: !loaderData,
			title: loaderData?.doc.title,
			description: loaderData?.doc.summary,
			path: `/components/${params.slug}`,
			// `pnpm shots` only captures elements with a demo - `hasDemo` is the
			// same gate it uses, so this points at a file only when one exists.
			image: hasDemo(params.slug)
				? `/shots/${params.slug}-laptop.webp`
				: undefined,
		}),
		// The machine-readable half: this page is source code somebody installs.
		scripts: loaderData?.doc.item
			? [ldScript(componentSourceCode(loaderData.doc.item))]
			: [],
	}),
});
