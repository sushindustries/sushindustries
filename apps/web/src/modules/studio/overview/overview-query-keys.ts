import { queryOptions } from "@tanstack/react-query";
import { PROJECTION, rootFor } from "../studio.cache";
import { readStudio } from "./overview.functions";

/*
 * The header's numbers, as a query rather than as loader data.
 *
 * They were neither. `/studio`'s loader fetched the report and handed it to
 * the header through `useLoaderData`, which put the four tiles that answer
 * "is this up to date" outside the cache entirely - so `invalidateQueries`
 * could not reach them, and running a sync left the header reporting the
 * counts and the last-run time from before it. The one number on the page
 * whose whole job is to say how stale things are was the one number nothing
 * could refresh.
 *
 * Under `PROJECTION` because that is what it counts. The same invalidation
 * that refreshes the documents after a sync now refreshes the header that
 * describes them, which is the point of naming origins rather than features.
 */

export const overviewKeys = {
	all: rootFor(PROJECTION, "overview"),
	report: () => [...overviewKeys.all, "report"] as const,
};

export const overviewQueryOptions = () =>
	queryOptions({
		queryKey: overviewKeys.report(),
		queryFn: () => readStudio(),
		/*
		 * A minute, matching the other projection queries. The report is counts
		 * over the whole index and those only move when a sync runs - and when
		 * one does, the invalidation above is what refreshes this, not the clock.
		 */
		staleTime: 60_000,
	});
