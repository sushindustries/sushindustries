import { DataTable, type DataTableColumn } from "@sushindustries/ui";
import type { StudioReport } from "./overview.server";

/*
 * The projection, as tables.
 *
 * Wiring rather than a component: it names this site's tables and this site's
 * columns, which is exactly the thing that would not survive being installed
 * somewhere else. `DataTable` is the component and lives in `packages/ui`;
 * what is here is the four column definitions that make it about this
 * database.
 *
 * Read-only, and every number comes from `studioReport()` in one round trip.
 * Nothing here fetches.
 */

const number = (value: number) => value.toLocaleString();

export function StudioTables({ report }: { readonly report: StudioReport }) {
	const tables: DataTableColumn<{ table: string; rows: number }>[] = [
		{ id: "table", header: "Table", mono: true, sortable: true },
		{
			id: "rows",
			header: "Rows",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.rows),
		},
	];

	const kinds: DataTableColumn<StudioReport["documentsByKind"][number]>[] = [
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

	const providers: DataTableColumn<StudioReport["providers"][number]>[] = [
		{ id: "provider", header: "Provider", mono: true, sortable: true },
		{
			id: "entries",
			header: "Entries",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.entries),
		},
	];

	const heaviest: DataTableColumn<StudioReport["heaviest"][number]>[] = [
		{ id: "path", header: "Path", mono: true, sortable: true },
		{
			id: "tokens",
			header: "Tokens",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.tokens),
		},
	];

	const viewed: DataTableColumn<StudioReport["mostViewed"][number]>[] = [
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
			<section className="flex col gap-3">
				<h2>Tables</h2>
				<DataTable
					label="Row counts per table"
					rows={Object.entries(report.tables).map(([table, rows]) => ({
						table,
						rows,
					}))}
					columns={tables}
					sortBy="rows"
					descending
				/>
			</section>

			<section className="flex col gap-3">
				<h2>Documents by kind</h2>
				<DataTable
					label="Documents grouped by kind, with their token cost"
					rows={report.documentsByKind}
					columns={kinds}
					sortBy="tokens"
					descending
				/>
			</section>

			<section className="flex col gap-3">
				<h2>Heaviest documents</h2>
				<DataTable
					label="The documents that cost the most tokens to read"
					rows={report.heaviest}
					columns={heaviest}
					sortBy="tokens"
					descending
				/>
			</section>

			<section className="flex col gap-3">
				<h2>Most viewed</h2>
				<DataTable
					label="The pages people actually open"
					rows={report.mostViewed}
					columns={viewed}
					sortBy="views"
					descending
					// Not an error: nobody has opened anything since the last reset,
					// or the counter is not wired on those routes yet.
					empty="No views recorded yet."
				/>
			</section>

			<section className="flex col gap-3">
				<h2>Reference providers</h2>
				<DataTable
					label="Mirrored documentation providers, largest first"
					rows={report.providers}
					columns={providers}
					sortBy="entries"
					descending
				/>
			</section>
		</div>
	);
}
