import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { StudioTables } from "../modules/studio/overview/overview-tables";

/*
 * The overview: what is in the database, in aggregates.
 *
 * It renders the layout's loader data rather than fetching anything. The
 * report is one round trip, the layout already made it to decide whether to
 * let anybody in, and asking again here would be a second query for numbers
 * already on the screen above.
 *
 * `getRouteApi` rather than a second loader, which is the typed way to read a
 * parent's data: the string is checked against the route tree, so renaming the
 * layout breaks this at compile time instead of at render.
 *
 * Aggregates only - no row bodies, no page text - which keeps it small enough
 * to read whole and carrying nothing worth protecting beyond the fact that it
 * is production.
 */
const studio = getRouteApi("/studio");

export const Route = createFileRoute("/studio/")({
	component: Overview,
});

function Overview() {
	const { report } = studio.useLoaderData();

	return (
		<div className="flex col gap-5">
			<p className="fg-dim">
				Everything here is a projection rebuilt by{" "}
				<code>pnpm sushindustries sync</code> - except <code>page_views</code>{" "}
				and <code>page_feedback</code>, which are the two nothing rebuilds.
			</p>

			<StudioTables report={report} />
		</div>
	);
}
