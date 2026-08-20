import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ComponentDoc } from "../../modules/content/components/component-doc";

/*
 * The component at its first section.
 *
 * A leaf beside `$slug.$section.tsx` rather than the layout's own component,
 * because a route that both renders a page and hosts children renders the page
 * for the children too - which is exactly how every section URL came to show
 * the overview with the wrong tab lit.
 *
 * The data comes from the layout's loader; this adds no fetch of its own.
 */
const parent = getRouteApi("/components/$slug");

export const Route = createFileRoute("/components/$slug/")({
	component: ComponentIndex,
});

function ComponentIndex(): ReactNode {
	const { doc, headings, links } = parent.useLoaderData();
	return <ComponentDoc doc={doc} headings={headings} links={links} />;
}
