import { queryOptions } from "@tanstack/react-query";
import { PROJECTION, rootFor } from "../studio.cache";
import { readHubBars } from "./hub.functions";

/*
 * The hub chart's key and options.
 *
 * `queryOptions()` ties the key to the function that fills it, so the route's
 * prefetch and the component's read cannot drift onto different keys - which
 * is the silent version of a prefetch: paid for, and never read.
 */
export const hubKeys = {
	all: rootFor(PROJECTION, "hub"),
	bars: () => [...hubKeys.all, "bars"] as const,
};

export const hubBarsQueryOptions = () =>
	queryOptions({
		queryKey: hubKeys.bars(),
		queryFn: () => readHubBars(),
		/*
		 * Five minutes. These are counts over the whole index and they only move
		 * when a sync runs, so refetching on every visit to the hub asks the same
		 * question of the same rows.
		 */
		staleTime: 5 * 60_000,
	});
