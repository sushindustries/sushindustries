import { Button, Workbench } from "@sushindustries/ui";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import type { WriteResult } from "../studio.schemas";
import { applyDocumentAction } from "./documents.functions";
import type {
	DocumentActionRequest,
	DocumentSort,
	DocumentsQuery,
} from "./documents.schemas";
import {
	DocumentActionDialog,
	type PendingAction,
} from "./documents-action-dialog";
import { DocumentsAside } from "./documents-aside";
import {
	documentFiltersQueryOptions,
	documentKeys,
	documentsQueryOptions,
} from "./documents-query-keys";
import { DocumentViewer } from "./documents-viewer";

/*
 * The documents feature, assembled.
 *
 * Three panes and one query. The aside filters, the viewer shows what the
 * aside selected, the dialog confirms what the viewer proposes - and all of it
 * reads the same cache entry, which is the reason this composition exists at
 * all rather than three routes that each fetch their own copy.
 *
 * Wiring rather than a component: every visible piece is installable from
 * `@sushindustries/ui`, and what is here is the part that names *this*
 * database. That is the placement test, and this file fails it deliberately.
 *
 * Three TanStack libraries, each doing exactly its one thing:
 *
 *   Query   owns the data. Nothing here fetches; it reads a cache and
 *           invalidates it after a write.
 *   Pacer   owns the typing. The box updates on every key, the query key does
 *           not, and the input stays fully controlled throughout.
 *   Table   sorts within a page, inside `DataTable`.
 *
 * The Pacer split is worth naming because the version everybody writes first
 * is a `setTimeout`, and it is subtly wrong three ways: it has to be cleared
 * on unmount, it fires after a navigation, and "still typing" is invisible so
 * the table looks stale rather than pending. A debounced *value* has none of
 * those - only the derived key is delayed.
 */

/** Long enough to skip the middle of a word, short enough to feel like filtering. */
const TYPING_MS = 300;

/** One page. Also the step the pager moves by, so they cannot disagree. */
const PAGE = 50;

/**
 * The query the workspace opens with.
 *
 * Exported because the route prefetches exactly this key, and a prefetch under
 * a key nobody reads is a round trip paid for and thrown away. Two literals
 * would drift the first time a default changed - the miss would be silent, and
 * would look like the page simply being slow.
 */
export const DEFAULT_DOCUMENTS_QUERY: DocumentsQuery = {
	sort: "path",
	direction: "asc",
	limit: PAGE,
	offset: 0,
};

const number = (value: number) => value.toLocaleString();

export function DocumentsWorkspace(): ReactNode {
	const client = useQueryClient();

	const [search, setSearch] = useState("");
	const [kind, setKind] = useState("");
	const [sort, setSort] = useState<DocumentSort>(
		DEFAULT_DOCUMENTS_QUERY.sort as DocumentSort,
	);
	const [direction, setDirection] = useState<"asc" | "desc">("asc");
	const [offset, setOffset] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);

	const [pending, setPending] = useState<PendingAction | null>(null);
	const [result, setResult] = useState<WriteResult | null>(null);

	/*
	 * The typed value and the fetched value are two different things. `search`
	 * is what is in the box; `debounced` is what the query key is built from,
	 * so a five-letter word costs one request rather than five.
	 */
	const [debounced] = useDebouncedValue(search, { wait: TYPING_MS });

	const query: DocumentsQuery = {
		search: debounced || undefined,
		kind: (kind || undefined) as DocumentsQuery["kind"],
		sort,
		direction,
		limit: PAGE,
		offset,
	};

	const documents = useQuery(documentsQueryOptions(query));
	const filters = useQuery(documentFiltersQueryOptions());

	/*
	 * Every write goes through one mutation, because every write invalidates
	 * the same thing: the whole feature. A rename changes a list, a detail and
	 * the facet counts, so anything narrower would leave two of the three
	 * showing the old name - and choosing per action is three chances to choose
	 * wrong.
	 *
	 * Only when it was applied. A plan changed nothing, so throwing the cache
	 * away after one would refetch every row to redraw them identically.
	 */
	const act = useMutation({
		/*
		 * One write at a time, across the whole studio.
		 *
		 * A scope makes Query serialise every mutation sharing the id: a second
		 * one queues rather than running beside the first. That matters here more
		 * than in most apps, because these mutations are commits. Two writes in
		 * flight against the same branch means the second builds its tree from a
		 * ref the first is about to move, and the `force: false` on the ref
		 * update turns that into a failure - a correct failure, and one nobody
		 * should have to see.
		 *
		 * It also removes the whole class of "pressed apply twice": the second
		 * press waits for the first to finish and then plans against the file the
		 * first one wrote.
		 */
		scope: { id: "studio-writes" },
		mutationFn: (request: DocumentActionRequest) =>
			applyDocumentAction({ data: request }),
		onSuccess: (answer) => {
			setResult(answer);
			if (answer.applied) {
				client.invalidateQueries({ queryKey: documentKeys.all });
				// The document it was showing may not be at that path any more.
				if (answer.action === "move" || answer.action === "remove") {
					setSelected(null);
				}
			}
		},
	});

	/** Opens the dialog for a request, with any previous answer cleared. */
	const propose = (request: DocumentActionRequest) => {
		setResult(null);
		act.reset();
		setPending({ action: request.action.action, request });
	};

	const rows = documents.data?.rows ?? [];
	const total = documents.data?.total ?? 0;
	const page = Math.floor(offset / PAGE) + 1;
	const pages = Math.max(1, Math.ceil(total / PAGE));

	return (
		<>
			<Workbench
				title="documents"
				label="Every document in the index"
				maxHeight="min(74vh, 52rem)"
				toolbar={
					<Button
						onClick={() => {
							setResult(null);
							act.reset();
							setPending({ action: "create" });
						}}
					>
						New
					</Button>
				}
				rail={
					<DocumentsAside
						search={search}
						onSearch={(value) => {
							setSearch(value);
							// A new filter is a new list, so the old offset is a page
							// into something that no longer exists.
							setOffset(0);
						}}
						kind={kind}
						onKind={(value) => {
							setKind(value);
							setOffset(0);
						}}
						kinds={filters.data?.kinds ?? []}
						sort={sort}
						onSort={setSort}
						direction={direction}
						onDirection={setDirection}
						rows={rows}
						total={total}
						selected={selected}
						onSelect={setSelected}
						loading={documents.isFetching}
					/>
				}
				status={
					<>
						<span className="workbench-stat">
							<b>{number(rows.length)}</b> of <b>{number(total)}</b>
						</span>
						<span className="workbench-stat">
							page <b>{number(page)}</b> of <b>{number(pages)}</b>
						</span>
						{documents.isFetching ? (
							<span className="workbench-stat">refreshing…</span>
						) : null}

						{/*
						 * Where a write would land, said before anybody makes one.
						 * "Nothing here can write" and "it wrote somewhere you did not
						 * expect" are both things to learn before a rename.
						 */}
						{filters.data?.writers
							.filter((option) => option.available)
							.map((option) => (
								<span key={option.name} className="workbench-stat">
									writes → <b>{option.name}</b>
								</span>
							))}

						<span className="flex items-center gap-2">
							<Button
								variant="ghost"
								disabled={offset === 0}
								onClick={() => setOffset(Math.max(0, offset - PAGE))}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								disabled={offset + PAGE >= total}
								onClick={() => setOffset(offset + PAGE)}
							>
								Next
							</Button>
						</span>
					</>
				}
			>
				{selected ? (
					<DocumentViewer
						key={selected}
						path={selected}
						onAction={propose}
						result={result}
					/>
				) : (
					<div className="flex col gap-3">
						<h2>Pick something on the left</h2>
						<p className="fg-dim">
							Everything here is a projection of the repository, rebuilt by{" "}
							<code>pnpm sushindustries sync</code>. Selecting a document shows
							it as the site renders it, with what it is called beside it.
						</p>
						<p className="fg-dim">
							Changing a title rewrites one line of frontmatter. Changing a slug
							moves every file with that name and tells you which links stop
							resolving - before it does it.
						</p>
					</div>
				)}
			</Workbench>

			<DocumentActionDialog
				pending={pending}
				result={result}
				busy={act.isPending}
				error={act.error instanceof Error ? act.error.message : null}
				onRun={(request) => act.mutate(request)}
				onClose={() => {
					setPending(null);
					setResult(null);
					act.reset();
				}}
			/>
		</>
	);
}
