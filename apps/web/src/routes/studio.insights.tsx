import { createFileRoute } from "@tanstack/react-router";
import { InsightsPanel } from "../modules/studio/insights/insights-panel";
import { insightsQueryOptions } from "../modules/studio/insights/insights-query-keys";

/*
 * Insights: named questions, each with one answer.
 *
 * This route used to render the whole report - every chart and every table the
 * overview computed - which made it a page rather than a section. Each insight
 * is now a Markdown file naming a metric, so what appears here is content and
 * adding one touches no code.
 *
 * The loader prefetches every answer rather than the list of questions. A page
 * of titles that fill in one by one is a page that looks broken while it
 * works, and each metric is one query - they run in parallel on the server,
 * where the round trip is a socket rather than the network.
 */
export const Route = createFileRoute("/studio/insights")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(insightsQueryOptions()),
	component: InsightsPanel,
	head: () => ({
		meta: [
			{ title: "Insights · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
