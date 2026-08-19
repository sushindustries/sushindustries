import { Field, Input, NativeSelect } from "@sushindustries/ui";
import type { ReactNode } from "react";
import type { DocumentRow, DocumentSort } from "./documents.schemas";
import { DOCUMENT_SORTS } from "./documents.schemas";

/*
 * The aside: search, filters, and the list they produce.
 *
 * It holds no state and fetches nothing. Every value arrives as a prop and
 * every change leaves as a callback, which is what lets the workspace above
 * own the one query the whole feature reads - two components each holding half
 * a filter is how a list and its own header end up disagreeing about what is
 * being shown.
 *
 * The list is buttons rather than links, and that is a real decision rather
 * than an oversight. A link would put the path in the URL and reload the pane;
 * selecting a row here changes which document the viewer beside it is showing,
 * with the list, the scroll position and the search all still in place. The
 * route is `/studio/documents` either way - what is selected is a state of the
 * workspace, not an address.
 */

export interface DocumentsAsideProps {
	readonly search: string;
	readonly onSearch: (value: string) => void;

	readonly kind: string;
	readonly onKind: (value: string) => void;
	readonly kinds: readonly { value: string; count: number }[];

	readonly sort: DocumentSort;
	readonly onSort: (value: DocumentSort) => void;
	readonly direction: "asc" | "desc";
	readonly onDirection: (value: "asc" | "desc") => void;

	readonly rows: readonly DocumentRow[];
	readonly total: number;

	/** The path of the document the viewer is showing, if any. */
	readonly selected: string | null;
	readonly onSelect: (path: string) => void;

	/** True while a fetch is in flight, so the list can say so without emptying. */
	readonly loading: boolean;
}

export function DocumentsAside({
	search,
	onSearch,
	kind,
	onKind,
	kinds,
	sort,
	onSort,
	direction,
	onDirection,
	rows,
	total,
	selected,
	onSelect,
	loading,
}: DocumentsAsideProps): ReactNode {
	return (
		<div className="flex col gap-4">
			{/*
			 * `Field` rather than a label and a span, so the control nests inside
			 * the label element. That association survives a refactor without ids,
			 * which the `for`/`id` pair does not.
			 */}
			<Field label="Search" hint="Titles, paths, summaries and bodies.">
				<Input
					type="search"
					value={search}
					placeholder="card, sitemap, drizzle…"
					onChange={(event) => onSearch(event.target.value)}
				/>
			</Field>

			<Field label="Kind">
				<NativeSelect
					value={kind}
					onChange={(event) => onKind(event.target.value)}
				>
					<option value="">Everything</option>
					{/*
					 * Read from the database rather than from the enum. A kind with no
					 * documents in it is a filter that is not offered, and a control
					 * that can only ever return nothing is worse than no control.
					 */}
					{kinds.map((facet) => (
						<option key={facet.value} value={facet.value}>
							{facet.value} ({facet.count})
						</option>
					))}
				</NativeSelect>
			</Field>

			<Field label="Order">
				<NativeSelect
					value={`${sort}:${direction}`}
					onChange={(event) => {
						const [next, way] = event.target.value.split(":");
						onSort(next as DocumentSort);
						onDirection(way as "asc" | "desc");
					}}
				>
					{DOCUMENT_SORTS.flatMap((one) => [
						<option key={`${one}:asc`} value={`${one}:asc`}>
							{one} ↑
						</option>,
						<option key={`${one}:desc`} value={`${one}:desc`}>
							{one} ↓
						</option>,
					])}
				</NativeSelect>
			</Field>

			<div className="flex col gap-2">
				<p className="label">
					{loading ? "Searching…" : `${rows.length} of ${total}`}
				</p>

				{/*
				 * A real list, so a screen reader is told how many there are before
				 * it starts reading them. A stack of buttons in a div is announced
				 * one at a time with no idea how far it goes.
				 */}
				<ul className="studio-list">
					{rows.map((row) => (
						<li key={row.path}>
							<button
								type="button"
								className="studio-list-item"
								aria-current={row.path === selected ? "true" : undefined}
								onClick={() => onSelect(row.path)}
							>
								<span className="text-sm font-semibold break-anywhere">
									{row.title ?? row.slug ?? row.path}
								</span>
								<span className="studio-list-path">{row.path}</span>
								<span className="studio-list-meta">
									{row.kind}
									{row.section ? ` · ${row.section}` : ""} ·{" "}
									{row.tokens.toLocaleString()} tokens
								</span>
							</button>
						</li>
					))}
				</ul>

				{rows.length === 0 && !loading ? (
					<p className="fg-dim">Nothing matches that.</p>
				) : null}
			</div>
		</div>
	);
}
