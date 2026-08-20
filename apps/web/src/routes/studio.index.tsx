import { createFileRoute } from "@tanstack/react-router";
import { HubPanel } from "../modules/studio/hub/hub-panel";
import { hubBarsQueryOptions } from "../modules/studio/hub/hub-query-keys";

/*
 * The hub: which part of the studio do you want.
 *
 * It used to be the overview - every chart and every table - which made the
 * landing page the longest one in the studio and the thing you scrolled past
 * to get anywhere else. Those moved to `/studio/insights`, which is a section
 * like the others, and this is a short index that cannot fall behind: the
 * cards are `studio.sections.ts` rendered.
 *
 * No loader. The layout above already fetched the report to decide whether to
 * let anybody in, and the hub needs nothing beyond the section table, which is
 * a module rather than a query.
 */
export const Route = createFileRoute("/studio/")({
	/*
	 * The chart's numbers, prefetched. The section cards need nothing - they
	 * are a module, not a query - so this is the only thing the hub waits for,
	 * and it arrives in the first paint rather than after it.
	 */
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(hubBarsQueryOptions()),
	component: HubPanel,
});
