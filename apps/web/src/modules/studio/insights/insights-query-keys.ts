import { queryOptions } from "@tanstack/react-query";
import { PROJECTION, rootFor } from "../studio.cache";
import { listStudioInsights } from "./insights.functions";

/*
 * Keys, and the options built on them.
 *
 * `all` is the prefix everything extends, so one invalidation after a sync
 * refreshes every answer - which is correct, because a sync rewrites the rows
 * every metric reads and there is no insight it cannot have changed.
 */
export const insightKeys = {
	all: rootFor(PROJECTION, "insights"),
	list: () => [...insightKeys.all, "list"] as const,
};

export const insightsQueryOptions = () =>
	queryOptions({
		queryKey: insightKeys.list(),
		queryFn: () => listStudioInsights(),
		/*
		 * A minute. Every answer is computed from the projection, and the
		 * projection only moves when a sync runs - so refetching faster asks the
		 * same question of the same rows.
		 */
		staleTime: 60_000,
	});
