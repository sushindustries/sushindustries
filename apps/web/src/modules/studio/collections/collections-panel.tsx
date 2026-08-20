import {
	Badge,
	Button,
	DataTable,
	type DataTableColumn,
	MarkdownView,
	Workbench,
} from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { number } from "../format";
import { StudioSearch } from "../studio-search";
import {
	collectionQueryOptions,
	collectionsQueryOptions,
} from "./collections-query-keys";

/*
 * Collections, on screen: the list on the left, one collection on the right.
 *
 * The same shape as the documents workspace on purpose. Two sections of one
 * tool that browse differently teach the tool twice, and there is nothing
 * about a collection that needs a different arrangement from a document - a
 * list you filter, a thing you selected, and what it says.
 *
 * What it deliberately does not have is an editor. A collection is changed by
 * changing the Markdown file that defines it, which is a document, which is
 * what the Documents section already edits - so the button here is a link
 * there rather than a second form over the same file. Two editors for one file
 * is two places for a save to be lost.
 */

export function CollectionsPanel(): ReactNode {
	const collections = useQuery(collectionsQueryOptions());
	const [selected, setSelected] = useState<string | null>(null);

	const all = collections.data ?? [];
	const current = selected ?? all[0]?.collection.id ?? null;

	return (
		<Workbench
			title="collections"
			label="Named sets of documents"
			maxHeight="min(74vh, 52rem)"
			rail={
				<div className="flex col gap-3">
					{/*
					 * Scoped to collections. The same box as the hub's, told to look
					 * at one thing - a search here that returned forty documents
					 * would be answering a question nobody asked on this page.
					 */}
					<StudioSearch scope="collections" />

					<p className="label">{all.length} collections</p>

					<ul className="studio-list">
						{all.map(({ collection, total, tokens }) => (
							<li key={collection.id}>
								<button
									type="button"
									className="studio-list-item"
									aria-current={collection.id === current ? "true" : undefined}
									onClick={() => setSelected(collection.id)}
								>
									<span className="text-sm font-semibold break-anywhere">
										{collection.title}
									</span>
									<span className="studio-list-meta">
										{number(total)} documents · {number(tokens)} tokens
									</span>
								</button>
							</li>
						))}
					</ul>

					{all.length === 0 && !collections.isPending ? (
						<p className="fg-dim text-sm">
							None yet. <code>pnpm new collection &lt;slug&gt;</code> writes one
							from the template.
						</p>
					) : null}
				</div>
			}
			status={
				<>
					<span className="workbench-stat">
						<b>{number(all.length)}</b> collections
					</span>
					<span className="workbench-stat">
						<b>{number(all.reduce((sum, one) => sum + one.total, 0))}</b>{" "}
						memberships
					</span>
					{collections.isFetching ? (
						<span className="workbench-stat">refreshing…</span>
					) : null}
				</>
			}
		>
			{current ? <CollectionView id={current} /> : <Nothing />}
		</Workbench>
	);
}

function Nothing(): ReactNode {
	return (
		<div className="flex col gap-3">
			<h2>A collection is a saved question</h2>
			<p className="fg-dim">
				Not a saved answer. Each one carries a filter - a kind, a section, a
				search - and its membership is worked out when you ask, so a document
				added next month joins every collection it matches with nothing edited.
			</p>
			<p className="fg-dim">
				That is also the constraint. If the set you want cannot be described as
				a filter, it is not a collection: it is a list, and a list belongs in
				prose where somebody can see who wrote it and why.
			</p>
		</div>
	);
}

function CollectionView({ id }: { readonly id: string }): ReactNode {
	const collection = useQuery(collectionQueryOptions(id));

	if (collection.isPending) return <p className="fg-dim">Reading {id}…</p>;

	const found = collection.data;
	if (!found) return <p className="fg-dim">No collection called {id}.</p>;

	const columns: DataTableColumn<(typeof found.members)[number]>[] = [
		{ id: "path", header: "Path", mono: true, sortable: true },
		{ id: "title", header: "Title", cell: (row) => row.title ?? "-" },
		{
			id: "tokens",
			header: "Tokens",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.tokens),
		},
	];

	/*
	 * The filter, drawn as the badges it is made of.
	 *
	 * Shown rather than described, because the name of a collection is a claim
	 * and the filter is what it actually does - and the two drift the moment
	 * somebody edits one of them. A collection whose badges do not match its
	 * title is a collection to go and fix.
	 */
	const filter = [
		found.collection.kind && `kind = ${found.collection.kind}`,
		found.collection.section && `section = ${found.collection.section}`,
		found.collection.search && `matches "${found.collection.search}"`,
	].filter(Boolean) as string[];

	return (
		<div className="flex col gap-5">
			<header className="flex col gap-3">
				<h2 className="m-0">{found.collection.title}</h2>
				<p className="fg-dim">{found.collection.summary}</p>

				<div className="flex items-center gap-2 wrap">
					{filter.length > 0 ? (
						filter.map((one) => (
							<Badge key={one} tone="docs">
								{one}
							</Badge>
						))
					) : (
						<Badge>everything</Badge>
					)}
					<Badge>{number(found.total)} documents</Badge>
					<Badge>{number(found.tokens)} tokens</Badge>
				</div>

				{/*
				 * The link out rather than a second editor. A collection is a
				 * Markdown file, and the Documents section already edits Markdown
				 * files - two editors over one file is two places for a save to be
				 * lost.
				 */}
				<div>
					<Button
						variant="ghost"
						href={`/studio/documents?path=${encodeURIComponent(found.collection.path)}`}
					>
						Edit the definition
					</Button>
				</div>
			</header>

			{found.collection.body ? (
				<article className="prose studio-preview">
					<MarkdownView source={found.collection.body} />
				</article>
			) : null}

			<section className="flex col gap-3">
				<h3>What is in it</h3>
				<DataTable
					label={`Every document matching ${found.collection.title}`}
					rows={found.members}
					columns={columns}
					sortBy="tokens"
					descending
					empty="Nothing matches this filter. That usually means the filter is wrong rather than the repository being empty."
				/>
			</section>
		</div>
	);
}
