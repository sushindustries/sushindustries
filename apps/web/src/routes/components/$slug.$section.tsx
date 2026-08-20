import { hasDemo } from "@sushindustries/ui/demo-sources";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	ComponentDoc,
	loadComponentDoc,
} from "../../modules/content/components/component-doc";
import { seo } from "../../modules/seo/seo";

/*
 * One section of one component, at its own address.
 *
 * A flat dotted file with both dynamic segments in the name, per the routes
 * rule - directories for dynamic segments are the shape that collided with
 * `auth/github.ts` and silently 404'd the nested route.
 *
 * What this adds is a real URL per section, which is what makes each of the
 * five indexable, linkable and quotable on its own. The document itself comes
 * from the layout next door, so this route fetches nothing.
 */
const parent = getRouteApi("/components/$slug");

export const Route = createFileRoute("/components/$slug/$section")({
	component: ComponentSection,

	/*
	 * A section this component does not have is a 404 rather than a silent
	 * fallback to the first. `/components/card/nonsense` rendering the overview
	 * would be a page that answers to any address, which is how a typo becomes
	 * a duplicate in somebody's index.
	 */
	loader: ({ params }) => {
		/*
		 * Validated here rather than in the component, because a `notFound()`
		 * thrown while rendering produces a rendered not-found page with a 200
		 * on it - the page said "nothing here" and the status said "here you
		 * are", which is the pair a crawler resolves in favour of the status.
		 *
		 * Calling the loader again costs nothing worth measuring: it reads a
		 * glob the build already inlined, with no IO and no network.
		 */
		const found = loadComponentDoc(params.slug);
		if (!found) throw notFound();

		if (!found.doc.sections.some((one) => one.id === params.section)) {
			throw notFound();
		}
	},

	head: ({ params }) => ({
		...seo({
			// The section's own name first: five pages called "Card" are five
			// results nobody can tell apart.
			title: `${params.slug} - ${params.section}`,
			path: `/components/${params.slug}/${params.section}`,
			image: hasDemo(params.slug)
				? `/shots/${params.slug}-laptop.webp`
				: undefined,
		}),
	}),
});

function ComponentSection(): ReactNode {
	const { doc, headings, links } = parent.useLoaderData();
	const { section } = Route.useParams();

	return (
		<ComponentDoc
			doc={doc}
			headings={headings}
			links={links}
			section={section}
		/>
	);
}
