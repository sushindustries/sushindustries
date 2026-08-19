import { createFileRoute } from "@tanstack/react-router";
import {
	documentFiltersQueryOptions,
	documentsQueryOptions,
} from "../modules/studio/documents/documents-query-keys";
import {
	DEFAULT_DOCUMENTS_QUERY,
	DocumentsWorkspace,
} from "../modules/studio/documents/documents-workspace";

/*
 * The documents workspace: search on the left, the document on the right.
 *
 * The loader prefetches and returns nothing, which is the pairing the Query
 * integration is for. `ensureQueryData` fills the cache the components are
 * about to read, `setupRouterSsrQueryIntegration` dehydrates it into the
 * stream, and the browser hydrates it - so the first paint has the first page
 * of rows in it rather than an empty list that fills in a moment later.
 *
 * Returning the data instead would work and would be worse: the components
 * would then have two sources for the same rows, the loader's and the cache's,
 * and only one of them updates when a filter changes.
 *
 * Only the *default* page is prefetched. Every other combination of search,
 * filter and offset is a different key, and prefetching a page nobody has
 * asked for yet would be paying for a round trip on the chance somebody types.
 *
 * The route is thin, as every route in this repo is. Everything it does is in
 * `modules/studio/documents/`.
 */
export const Route = createFileRoute("/studio/documents")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				documentsQueryOptions(DEFAULT_DOCUMENTS_QUERY),
			),
			context.queryClient.ensureQueryData(documentFiltersQueryOptions()),
		]);
	},
	component: DocumentsWorkspace,
	head: () => ({
		meta: [
			{ title: "Documents · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
