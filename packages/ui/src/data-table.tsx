import {
	createCoreRowModel,
	createSortedRowModel,
	flexRender,
	rowSortingFeature,
	sortFns,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

/*
 * A table of rows somebody is reading.
 *
 * TanStack Table v9 does the work: sorting, row models, the header groups.
 * What this adds is the markup and the class names, which is the half a
 * headless library deliberately does not have an opinion about - and the half
 * this repo does. Every class here is defined in `@sushindustries/atoms`, so
 * the table flips with the theme like everything else and there is no colour
 * written down twice.
 *
 * Headless is why it is worth wrapping rather than reaching for a table
 * component with its own stylesheet: the sorting is somebody else's tested
 * code, and the appearance stays entirely ours.
 *
 * v9 rather than v8, and they are not the same API. v9 takes an explicit
 * `features` object and row models built with `create*RowModel`, where v8 had
 * `useReactTable` and `getCoreRowModel`. Passing v8's shape here type-errors
 * rather than silently rendering nothing, which is the good version of that
 * mistake.
 */

/*
 * Everything this table can do, declared once.
 *
 * In v9 the row models live here rather than in the options, alongside the
 * feature that uses them - `sortedRowModel` beside `rowSortingFeature`, and
 * `sortFns` because a sorted model with no comparators sorts nothing. The
 * types enforce the pairing, so turning a feature on without its model is a
 * compile error rather than a table that renders empty.
 *
 * Sorting only. Filtering, pagination and grouping are each one more slot in
 * here when something needs them, and until then they are code nobody ships.
 */
const features = tableFeatures({
	rowSortingFeature,
	coreRowModel: createCoreRowModel(),
	sortedRowModel: createSortedRowModel(),
	sortFns,
});

export interface DataTableColumn<TRow> {
	/** Key into the row, and the column's identity. */
	readonly id: string & keyof TRow;

	/** What the header says. Defaults to the id. */
	readonly header?: string;

	/** Render the cell. Defaults to the value, as text. */
	readonly cell?: (row: TRow) => ReactNode;

	/** Right-aligned with tabular figures. For counts and sizes. */
	readonly numeric?: boolean;

	/** Monospaced and breakable. For paths, hashes and identifiers. */
	readonly mono?: boolean;

	/** Off by default: a column of long prose sorts into nonsense. */
	readonly sortable?: boolean;
}

export interface DataTableProps<TRow> {
	readonly rows: readonly TRow[];
	readonly columns: readonly DataTableColumn<TRow>[];

	/** Which column to sort by first, and which way. */
	readonly sortBy?: string;
	readonly descending?: boolean;

	/** What to say when there are no rows. Not an error - usually a filter. */
	readonly empty?: string;

	/** Announced to screen readers, and never drawn. */
	readonly label: string;

	/**
	 * How much room each row gets.
	 *
	 * `comfortable` is a table somebody reads a few rows of. `compact` is one
	 * they scan fifty rows of, which is a genuinely different job: at fifty
	 * rows the padding is most of the height, and a table that needs two
	 * screens to show what fits on one is a table people stop scrolling.
	 *
	 * Only the padding and the line height change. The type stays the same size
	 * in both, because shrinking text to fit more of it is where a dense table
	 * stops being readable and starts being a screenshot.
	 */
	readonly density?: "comfortable" | "compact";

	/**
	 * Shades alternate rows.
	 *
	 * Off by default and worth turning on for wide tables specifically: banding
	 * exists to stop the eye slipping a row between the first column and the
	 * last, and a three-column table has no such distance to slip across. On a
	 * narrow table it is decoration that makes every second row look selected.
	 */
	readonly striped?: boolean;
}

export function DataTable<TRow extends object>({
	rows,
	columns,
	sortBy,
	descending = false,
	empty = "Nothing here.",
	label,
	density = "comfortable",
	striped = false,
}: DataTableProps<TRow>): ReactNode {
	/*
	 * Both type parameters, given rather than inferred.
	 *
	 * `useTable` infers `TData` from the `data` option, which works at a call
	 * site holding a concrete array and does not work here: inside a generic
	 * component `TRow` is still open, so inference falls back to `RowData` and
	 * every cell callback arrives as `unknown`. Naming them is what keeps
	 * `row.original` typed as the row a caller actually passed.
	 */
	const table = useTable<typeof features, TRow>({
		features,
		data: rows,
		columns: columns.map((column) => ({
			id: column.id,
			accessorKey: column.id,
			header: column.header ?? column.id,
			enableSorting: column.sortable ?? false,
			cell: column.cell
				? ({ row }) => column.cell?.(row.original)
				: ({ getValue }) => String(getValue() ?? ""),
		})),
		initialState: sortBy
			? { sorting: [{ id: sortBy, desc: descending }] }
			: undefined,
	});

	const byId = new Map<string, DataTableColumn<TRow>>(
		columns.map((column) => [column.id, column]),
	);

	/** The class a cell gets from how its column is meant to be read. */
	const cellClass = (id: string) => {
		const column = byId.get(id);
		return (
			[
				column?.mono && "data-table-mono",
				column?.numeric && "data-table-number",
			]
				.filter(Boolean)
				.join(" ") || undefined
		);
	};

	return (
		/*
		 * The frame is utilities, not a block class. Five declarations that all
		 * already have names - and a table's frame should be the same border and
		 * the same radius as the cards around it, which is what composing rather
		 * than redeclaring guarantees.
		 */
		<div className="overflow-x-auto max-w-full border rounded-xl bg-1">
			<table
				className="data-table"
				// Attributes rather than classes, so a caller cannot half-apply a
				// variant, and so the stylesheet reads as a table of states.
				data-density={density}
				data-striped={striped ? "" : undefined}
			>
				<caption className="sr-only">{label}</caption>
				<thead>
					{table.getHeaderGroups().map((group) => (
						<tr key={group.id}>
							{group.headers.map((header) => {
								const direction = header.column.getIsSorted();
								const content = flexRender(
									header.column.columnDef.header,
									header.getContext(),
								);

								return (
									<th
										key={header.id}
										className={cellClass(header.column.id)}
										// Read out by a screen reader, and the only place the
										// sort state is exposed as anything but an arrow.
										aria-sort={
											direction === "asc"
												? "ascending"
												: direction === "desc"
													? "descending"
													: undefined
										}
									>
										{header.column.getCanSort() ? (
											<button
												type="button"
												className="data-table-sort"
												onClick={header.column.getToggleSortingHandler()}
												data-direction={
													direction === "asc"
														? "↑"
														: direction === "desc"
															? "↓"
															: ""
												}
											>
												{content}
											</button>
										) : (
											content
										)}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.length === 0 ? (
						<tr>
							<td className="data-table-empty" colSpan={columns.length}>
								{empty}
							</td>
						</tr>
					) : (
						table.getRowModel().rows.map((row) => (
							<tr key={row.id}>
								{row.getAllCells().map((cell) => (
									<td key={cell.id} className={cellClass(cell.column.id)}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
