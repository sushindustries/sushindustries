import { createFileRoute } from "@tanstack/react-router";
import { CollectionsPanel } from "../modules/studio/collections/collections-panel";
import { collectionsQueryOptions } from "../modules/studio/collections/collections-query-keys";

/*
 * Collections: named sets of documents, each one a saved filter.
 *
 * The loader prefetches and returns nothing, which is the pairing the Query
 * integration is for. `ensureQueryData` fills the cache the panel is about to
 * read, the SSR integration dehydrates it into the stream, and the browser
 * hydrates it - so the first paint has the list in it rather than an empty
 * rail that fills a moment later.
 *
 * Returning the data instead would work and would be worse: the panel would
 * then have two sources for the same rows, the loader's and the cache's, and
 * only one of them updates.
 *
 * Only the listing. Which collection is open is a state of the panel, and
 * prefetching a collection nobody has selected would be a round trip on the
 * chance somebody clicks.
 */
export const Route = createFileRoute("/studio/collections")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(collectionsQueryOptions()),
	component: CollectionsPanel,
	head: () => ({
		meta: [
			{ title: "Collections · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
