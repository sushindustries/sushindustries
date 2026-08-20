import { syncedRows } from "@sushindustries/sync";

/*
 * A page's votes, as a collection - not a page's tally.
 *
 * `page_feedback` stores raw events on purpose (see schema.ts): a counter
 * answers one question and destroys the data that would answer the next.
 * This stays honest to that - it syncs the rows for one page, bounded because
 * the shape is already scoped to it, and the tally a reader sees is a
 * live-computed count over those rows rather than a second source of truth
 * the server and the client could disagree about.
 *
 * Synced rather than polled. The previous version refetched through a
 * `queryFn`, so a second reader's vote appeared whenever the query happened
 * to run again - on a page somebody leaves open, never. Electric streams the
 * rows out of the replication log, so a row arriving *is* the event.
 */

export interface FeedbackVote {
	id: string;
	page: string;
	vote: "up" | "down";
	createdAt: string;
	/*
	 * TanStack DB rows must satisfy `Row<unknown>`, and an interface has no
	 * implicit index signature - the identical shape without this line is
	 * rejected with an error that names neither the interface nor the reason.
	 */
	[key: string]: unknown;
}

/*
 * Not a module-scope singleton: this opens a stream, so one built at import
 * time would hold a connection for every page the reader has ever visited,
 * and on the server it would outlive the request that made it. Callers
 * memoize it themselves, keyed on the page they are actually on.
 */
export function createFeedbackCollection(page: string) {
	return syncedRows<FeedbackVote>({
		id: `page-feedback:${page}`,
		url: "/api/feedback/shape",
		scope: { page },
		getKey: (row) => row.id,

		/*
		 * The write path is the ordinary POST, which keeps its Zod schema and
		 * its 400. Only the transaction id comes back, and that is what lets
		 * the optimistic row survive until the same row arrives over the
		 * stream instead of flickering off and on in between.
		 */
		write: async (rows) => {
			const written = await Promise.all(
				rows.map(async (row) => {
					const response = await fetch("/api/feedback", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(row),
					});

					// `fetch` only rejects on a network failure - a 400 or a 500
					// still resolves, and resolving is what would tell the
					// collection the write succeeded. Without this check a
					// rejected vote would keep its optimistic row for good.
					if (!response.ok) {
						throw new Error(`feedback POST failed: ${response.status}`);
					}

					return (await response.json()) as { txid: number | null };
				}),
			);

			// One vote, so one transaction. Null means there was no database in
			// this environment and so nothing to wait for.
			return written[0]?.txid ?? null;
		},
	});
}
