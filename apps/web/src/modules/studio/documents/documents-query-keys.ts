import { queryOptions } from "@tanstack/react-query";
import {
	listDocuments,
	readDocument,
	readDocumentFilters,
} from "./documents.functions";
import type { DocumentsQuery } from "./documents.schemas";

/*
 * The keys, and the options built on them.
 *
 * A key factory rather than array literals at each call site. The literals
 * work right up until an invalidation needs to match a subtree - and then the
 * two places that wrote `["documents", query]` turn out to have serialised the
 * query differently, so one of them is never invalidated and the bug is a
 * table that refuses to refresh after a rename.
 *
 * `queryOptions()` rather than bare keys, which is the part worth insisting
 * on: it ties the key to the function that fills it, so a component cannot
 * fetch one thing under another's key. Passing the wrong pair stops being a
 * runtime mystery and becomes a type error at the call site.
 *
 * The hierarchy is deliberate. `all` is the prefix everything else extends, so
 * `invalidateQueries({ queryKey: documentKeys.all })` after a write refreshes
 * every list, every detail and the filters together - which is correct, since
 * a rename changes all three.
 */

export const documentKeys = {
	all: ["studio", "documents"] as const,

	lists: () => [...documentKeys.all, "list"] as const,
	list: (query: DocumentsQuery) => [...documentKeys.lists(), query] as const,

	details: () => [...documentKeys.all, "detail"] as const,
	detail: (path: string) => [...documentKeys.details(), path] as const,

	filters: () => [...documentKeys.all, "filters"] as const,
};

/**
 * A page of documents.
 *
 * `placeholderData` keeps the previous page on screen while the next one
 * loads, which is what makes typing in the search box feel like filtering
 * rather than like reloading: without it every keystroke empties the table for
 * as long as the round trip takes, and the eye reads that as the answer being
 * "nothing".
 */
export const documentsQueryOptions = (query: DocumentsQuery) =>
	queryOptions({
		queryKey: documentKeys.list(query),
		queryFn: () => listDocuments({ data: query }),
		placeholderData: (previous) => previous,
	});

export const documentQueryOptions = (path: string) =>
	queryOptions({
		queryKey: documentKeys.detail(path),
		queryFn: () => readDocument({ data: { path } }),
		/*
		 * A body is keyed by path and changes only when a sync runs, so five
		 * minutes of it is five minutes of not re-fetching a file to redraw the
		 * same panel. The list is the thing that has to feel live, not this.
		 */
		staleTime: 5 * 60_000,
	});

export const documentFiltersQueryOptions = () =>
	queryOptions({
		queryKey: documentKeys.filters(),
		queryFn: () => readDocumentFilters(),
		staleTime: 5 * 60_000,
	});
