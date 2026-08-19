import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { StudioCharts } from "../modules/studio/overview/overview-charts";
import { StudioTables } from "../modules/studio/overview/overview-tables";

/*
 * Insights: what is in the database, as shapes and then as numbers.
 *
 * It renders the layout's loader data rather than fetching. The report is one
 * round trip, the layout already made it to decide whether to let anybody in,
 * and asking again here would be a second query for numbers already on screen
 * in the header above.
 *
 * `getRouteApi` rather than a second loader, which is the typed way to read a
 * parent's data: the string is checked against the route tree, so renaming the
 * layout breaks this at compile time instead of at render.
 *
 * Charts and tables, both, rather than one replacing the other. A chart
 * answers "what is the shape of this" at a glance and cannot answer "how many
 * exactly"; a table answers the second and makes you do the first yourself.
 * The table is also the accessible answer - a chart is an image to a screen
 * reader however good its label is.
 */
const studio = getRouteApi("/studio");

export const Route = createFileRoute("/studio/insights")({
	component: Insights,
	head: () => ({
		meta: [
			{ title: "Insights · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function Insights() {
	const { report } = studio.useLoaderData();

	return (
		<div className="flex col gap-6">
			<p className="fg-dim">
				Everything here is a projection rebuilt by{" "}
				<code>pnpm sushindustries sync</code> - except <code>page_views</code>{" "}
				and <code>page_feedback</code>, which are the two nothing rebuilds.
			</p>

			<StudioCharts report={report} />
			<StudioTables report={report} />
		</div>
	);
}
