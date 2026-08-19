import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

/*
 * A page's votes, as a TanStack DB collection - not a page's tally.
 *
 * `page_feedback` stores raw events on purpose (see schema.ts): a counter
 * answers one question and destroys the data that would answer the next.
 * This collection stays honest to that - it syncs the rows for one page,
 * bounded because the query is already scoped to it, and the tally shown to
 * a reader is a live-computed count over those rows, not a second
 * source of truth the server and the client could disagree about.
 *
 * A vote is `collection.insert(...)`, exactly the shape
 * `@tanstack/query-db-collection` documents: the row appears in every live
 * query the instant the button is pressed, `onInsert` posts it to
 * `/api/feedback` in the background, and a failed POST rolls the row back
 * out - the one thing the plain-fetch version could not do, since it
 * marked the page "voted" before the network call ever resolved.
 */
export interface FeedbackVote {
	id: string;
	page: string;
	vote: "up" | "down";
	createdAt: string;
}

/*
 * Not a module-scope singleton: `getRouter()` makes a fresh QueryClient per
 * request on the server, and a collection built once at import time would
 * carry one request's client into every later request in the same process.
 * Callers memoize this themselves, keyed on the QueryClient they actually
 * have - once per request on the server, once per page on the client.
 */
export function createFeedbackCollection(
	queryClient: QueryClient,
	page: string,
) {
	return createCollection(
		queryCollectionOptions<FeedbackVote>({
			queryClient,
			queryKey: ["page-feedback", page],
			queryFn: async () => {
				const response = await fetch(
					`/api/feedback?page=${encodeURIComponent(page)}`,
				);
				if (!response.ok) return [];
				return (await response.json()) as FeedbackVote[];
			},
			getKey: (row) => row.id,
			onInsert: async ({ transaction }) => {
				// `fetch` only rejects on a network failure - a 400 or 500 response
				// still resolves, and resolving is what tells the collection the
				// write succeeded. Without the explicit check a rejected vote would
				// keep its optimistic row forever instead of rolling back.
				await Promise.all(
					transaction.mutations.map(async (mutation) => {
						const response = await fetch("/api/feedback", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify(mutation.modified),
						});
						if (!response.ok) {
							throw new Error(`feedback POST failed: ${response.status}`);
						}
					}),
				);
			},
		}),
	);
}
