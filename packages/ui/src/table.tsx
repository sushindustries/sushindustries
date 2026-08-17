import type { ReactNode } from "react";

export interface TableColumn<Row> {
	readonly key: string;
	readonly header: string;
	readonly render: (row: Row) => ReactNode;
	/** Right-align numbers; everything else reads left. */
	readonly align?: "left" | "right";
}

export interface TableProps<Row> {
	/** Header and renderer per column, in display order. `key` has to be unique across them. */
	columns: readonly TableColumn<Row>[];
	/** Rendered in the order given - sorting belongs to the page. Empty leaves the headers standing. */
	rows: readonly Row[];
	/** Stable id per row. */
	rowKey: (row: Row) => string;
	/** Announced description of what the table holds. */
	caption?: string;
}

/*
 * A table that is a <table>. Columns are declared once with their renderers,
 * which is as far toward a data grid as this goes - sorting and selection are
 * the page's state, and a table that owns them is a component that owns your
 * data flow. Scrolls sideways inside its own frame rather than breaking the
 * page.
 */
export function Table<Row>({
	columns,
	rows,
	rowKey,
	caption,
}: TableProps<Row>): ReactNode {
	return (
		<div className="table-frame" data-lenis-prevent>
			<table className="table">
				{caption ? <caption className="sr-only">{caption}</caption> : null}
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.key} data-align={column.align}>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={rowKey(row)}>
							{columns.map((column) => (
								<td key={column.key} data-align={column.align}>
									{column.render(row)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
