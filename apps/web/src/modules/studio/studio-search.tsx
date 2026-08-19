import { Icon, Input } from "@sushindustries/ui";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { listCollections } from "./collections/collections.catalogue";
import { documentsQueryOptions } from "./documents/documents-query-keys";

/*
 * One search box, over everything the studio knows.
 *
 * The hub used to open with a chart and five cards, which is a page that
 * answers "what is here" before anybody has asked it. The question people
 * actually arrive with is narrower and more specific - *this* post, *that*
 * skill - and a search box answers it in one step where browsing takes three.
 *
 * So this is the first thing on the page and nothing else competes with it.
 * Results cascade underneath as you type and disappear when the box is empty,
 * so the hub is a search box and a short list of sections until somebody wants
 * more than that.
 *
 * **Scoped, and the scope is the caller's.** A search box on the hub should
 * find anything; the same box on the Collections page should find collections
 * and not bury them under forty documents that happen to match. One component
 * with a `scope` prop rather than three near-identical boxes - the difference
 * between them is a filter, and a filter is an argument.
 *
 * Two sources, deliberately unequal in cost:
 *
 *   collections   inlined at build time, filtered in the browser. Free, and
 *                 there are a handful of them.
 *   documents     a query, debounced, capped. It searches the *body* of every
 *                 Markdown file, which sounds expensive and is not: the bodies
 *                 are one `ilike` over a table the projection already holds,
 *                 so a phrase somebody half-remembers from the middle of a
 *                 document is as findable as its title.
 *
 * Not a `CommandPalette`, which is the component this looks like. That one is
 * a modal over a fixed list the host already holds; this searches a database
 * as you type and lives in the page rather than over it. Reaching for it would
 * have meant passing a list that does not exist until a query returns.
 */

/** Long enough to skip the middle of a word, short enough to feel like filtering. */
const TYPING_MS = 250;

/** A jump-to, not a browser. Six fit without the page growing a scrollbar. */
const LIMIT = 6;

export interface StudioSearchProps {
	/**
	 * What this box is allowed to find.
	 *
	 * `everything` on the hub, narrower on a section - a search on the
	 * Collections page that returns forty documents has answered a question
	 * nobody asked there.
	 */
	readonly scope?: "everything" | "documents" | "collections";

	/** Overrides the placeholder, which otherwise describes the scope. */
	readonly placeholder?: string;

	/** How many document rows to show. The default suits a hub. */
	readonly limit?: number;
}

const PLACEHOLDERS: Record<string, string> = {
	everything: "Search everything - a post, a component, a skill, a collection",
	documents: "Search documents - titles, paths and everything in the bodies",
	collections: "Search collections",
};

export function StudioSearch({
	scope = "everything",
	placeholder,
	limit = LIMIT,
}: StudioSearchProps = {}): ReactNode {
	const navigate = useNavigate();
	const [term, setTerm] = useState("");
	const [debounced] = useDebouncedValue(term, { wait: TYPING_MS });

	const query = debounced.trim();

	const documents = useQuery({
		...documentsQueryOptions({
			search: query,
			sort: "tokens",
			direction: "asc",
			limit,
			offset: 0,
		}),
		/*
		 * Nothing is fetched until somebody types two characters. A single
		 * letter matches most of the index, which is a query that costs a round
		 * trip to return an answer nobody can use.
		 */
		// Not fetched at all when the scope excludes documents. `enabled` is
		// what keeps a collections-only box from querying a table it will
		// never show.
		enabled: query.length >= 2 && scope !== "collections",
	});

	const collections =
		scope === "documents"
			? []
			: listCollections().filter(
					(one) =>
						query.length >= 2 &&
						`${one.title} ${one.summary} ${one.id}`
							.toLowerCase()
							.includes(query.toLowerCase()),
				);

	const rows = documents.data?.rows ?? [];
	const showing = query.length >= 2;
	const empty =
		showing &&
		!documents.isFetching &&
		rows.length === 0 &&
		collections.length === 0;

	return (
		<search className="flex col gap-2">
			{/*
			 * A div, not a label. The input carries its own `aria-label`, so a
			 * wrapping label would be a second accessible name for one control -
			 * and a `<label>` whose only child control is already named is what
			 * the linter is objecting to, correctly.
			 *
			 * The icon is decorative and marked as such: "search" is already said
			 * by the input's own label and its type.
			 */}
			<div className="studio-search-field">
				<span aria-hidden="true" className="flex">
					<Icon name="search" />
				</span>
				<Input
					type="search"
					value={term}
					placeholder={placeholder ?? PLACEHOLDERS[scope]}
					aria-label="Search the studio"
					onChange={(event) => setTerm(event.target.value)}
				/>
			</div>

			{showing ? (
				<div className="studio-search-results">
					{collections.map((one) => (
						<button
							key={one.id}
							type="button"
							className="studio-list-item"
							onClick={() => navigate({ to: "/studio/collections" })}
						>
							<span className="text-sm font-semibold break-anywhere">
								{one.title}
							</span>
							<span className="studio-list-meta">collection · {one.id}</span>
						</button>
					))}

					{rows.map((row) => (
						<button
							key={row.path}
							type="button"
							className="studio-list-item"
							/*
							 * The path goes in the URL, so the Documents section can open
							 * on it. A search that lands you on a list you then have to
							 * search again is a search that did half its job.
							 */
							onClick={() =>
								navigate({
									to: "/studio/documents",
									search: { path: row.path },
								})
							}
						>
							<span className="text-sm font-semibold break-anywhere">
								{row.title ?? row.slug ?? row.path}
							</span>
							<span className="studio-list-meta">
								{row.kind}
								{row.section ? ` · ${row.section}` : ""} ·{" "}
								{row.tokens.toLocaleString()} tokens
							</span>
						</button>
					))}

					{documents.isFetching && rows.length === 0 ? (
						<p className="studio-search-note">Searching…</p>
					) : null}

					{empty ? (
						<p className="studio-search-note">
							Nothing matches that. The index is rebuilt by a sync - if you have
							just added something, it will not be here yet.
						</p>
					) : null}
				</div>
			) : null}
		</search>
	);
}
