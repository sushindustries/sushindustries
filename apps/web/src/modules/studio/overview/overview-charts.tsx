import {
	BarChart,
	Collapsible,
	DataTable,
	type DataTableColumn,
	Icon,
	type IconName,
} from "@sushindustries/ui";
import type { ReactNode } from "react";
import type { StudioReport } from "./overview.server";

/*
 * The report, as shapes.
 *
 * `overview-tables.tsx` beside this is the same data as numbers, and both are
 * here on purpose rather than one replacing the other. A chart answers "what
 * is the shape of this" in a glance and cannot answer "how many exactly"; a
 * table answers the second and makes you do the first yourself. They are
 * complementary questions and the panel shows both.
 *
 * It also means the charts are never the only way to read this. A chart is an
 * image to a screen reader however good its `ariaLabel` is, so the table under
 * each one is the accessible answer rather than a fallback - which is why they
 * are stacked rather than behind a toggle.
 *
 * Wiring: it names this repository's tables and this report's fields, so it
 * stays in the app. `BarChart` is the installable half.
 */

const number = (value: number) => value.toLocaleString();

/**
 * A section's heading, with its glyph.
 *
 * The icon is inside the `<summary>` rather than beside it, so the whole line
 * is one click target - an icon that is not part of the toggle is an icon that
 * does nothing when you press it, which is the most annoying possible outcome
 * for the largest thing in the row.
 */
const heading = (icon: IconName, text: string) => (
	<span className="flex items-center gap-2">
		<Icon name={icon} />
		{text}
	</span>
);

export function StudioCharts({
	report,
}: {
	readonly report: StudioReport;
}): ReactNode {
	const byKind = report.documentsByKind;

	const kindColumns: DataTableColumn<
		StudioReport["documentsByKind"][number]
	>[] = [
		{ id: "kind", header: "Kind", sortable: true },
		{
			id: "files",
			header: "Files",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.files),
		},
		{
			id: "tokens",
			header: "Tokens",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.tokens),
		},
	];

	const viewedColumns: DataTableColumn<StudioReport["mostViewed"][number]>[] = [
		{ id: "path", header: "Path", mono: true, sortable: true },
		{
			id: "views",
			header: "Views",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.views),
		},
	];

	return (
		<div className="flex col gap-6">
			{/*
			 * Each section opens rather than being scrolled past.
			 *
			 * Insights is four panels of the same shape - a chart, a paragraph, a
			 * table - and stacked open it is a page you scroll through to find the
			 * one you came for. `Collapsible` is a `<details>`, so the state is the
			 * browser's, it survives with JavaScript off, and Ctrl-F still finds
			 * text inside a closed one in every current engine.
			 *
			 * The first is open because a page whose every section is shut is a
			 * page that looks broken on arrival.
			 */}
			<Collapsible
				summary={heading("layers", "What it costs to read")}
				defaultOpen
			>
				<div className="flex col gap-3">
					<p className="fg-dim">
						Tokens per kind, largest first. This is the number that decides what
						an agent can be handed in one go - the file counts beside it are the
						less interesting half.
					</p>

					<BarChart
						label="Tokens per document kind"
						description={
							byKind[0]
								? `${byKind[0].kind} is the largest kind at ${number(byKind[0].tokens)} tokens.`
								: undefined
						}
						rows={byKind.map((row) => ({ label: row.kind, value: row.tokens }))}
						// The kinds are the subject here - a reader is comparing what
						// each kind costs, not reading a ranking - so colour carries
						// something. The most-viewed chart below is a ranking and stays
						// one fill, where colour would look like meaning and be
						// decoration.
						colorByCategory
						height={Math.max(160, byKind.length * 30)}
					/>

					<DataTable
						label="Documents grouped by kind, with their token cost"
						rows={byKind}
						columns={kindColumns}
						sortBy="tokens"
						descending
					/>
				</div>
			</Collapsible>

			<Collapsible summary={heading("star", "What people open")}>
				<div className="flex col gap-3">
					<p className="fg-dim">
						The one table here that is not a projection. Nothing rebuilds{" "}
						<code>page_views</code> - it is counted as it happens, so an empty
						chart means nobody has been rather than a sync that has not run.
					</p>

					<BarChart
						label="Most viewed pages"
						description={
							report.mostViewed[0]
								? `${report.mostViewed[0].path} is the most opened page, ${number(report.mostViewed[0].views)} times.`
								: "No views recorded yet."
						}
						rows={report.mostViewed.map((row) => ({
							// The path without its leading slash and section: an axis of
							// `/components/…` repeated ten times is ten identical labels.
							label: row.path.split("/").filter(Boolean).at(-1) ?? row.path,
							value: row.views,
						}))}
						height={Math.max(160, report.mostViewed.length * 30)}
					/>

					<DataTable
						label="The pages people actually open"
						rows={report.mostViewed}
						columns={viewedColumns}
						sortBy="views"
						descending
						empty="No views recorded yet."
					/>
				</div>
			</Collapsible>
		</div>
	);
}
