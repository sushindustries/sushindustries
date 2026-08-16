import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as z from "zod";
import { findDemo } from "../../modules/showcase/demos";

/*
 * A bare page rendering one demo, and nothing else.
 *
 * This exists to be loaded in an iframe. It deliberately has no nav, no footer
 * and no smooth scroll — the frame is meant to show the component's own
 * behaviour at a given width, and site chrome inside it would both lie about
 * the layout and steal the scroll.
 *
 * Two fits, because the two callers want opposite things:
 *
 *   full   the showcase frame. Real size, scrollable, the whole example.
 *   card   a 16:9 archive thumbnail. Centred, clipped, never scrolls.
 *
 * Without the card fit, a demo that is deliberately taller than the viewport —
 * which every scroll effect has to be — renders in a thumbnail as a scrollbar
 * and a corner of a component.
 *
 * Flat `$slug.tsx`: dynamic segments must not become route directories.
 */
const searchSchema = z.object({
	fit: z.enum(["full", "card"]).default("full"),
});

export const Route = createFileRoute("/preview/$slug")({
	component: PreviewPage,
	validateSearch: searchSchema,
	loader: ({ params }) => {
		if (!findDemo(params.slug)) throw notFound();
		return { slug: params.slug };
	},
	head: () => ({
		// A preview is never a search result.
		meta: [{ name: "robots", content: "noindex" }],
	}),
});

function PreviewPage(): ReactNode {
	const { slug } = Route.useLoaderData();
	const { fit } = Route.useSearch();
	const demo = findDemo(slug);

	if (!demo) return null;

	const isCard = fit === "card";

	return (
		<div className={isCard ? "preview-root is-card" : "preview-root"}>
			{isCard ? (demo.poster ?? demo.element) : demo.element}
		</div>
	);
}
