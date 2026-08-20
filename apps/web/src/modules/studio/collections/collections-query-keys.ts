import { queryOptions } from "@tanstack/react-query";
import { PROJECTION, rootFor } from "../studio.cache";
import {
	listStudioCollections,
	readStudioCollection,
} from "./collections.functions";

/*
 * Keys and the options built on them.
 *
 * `queryOptions()` rather than bare keys, which ties the key to the function
 * that fills it - so a component cannot fetch one thing under another's key,
 * and the wrong pairing is a type error at the call site rather than a
 * runtime mystery.
 *
 * `all` is the prefix everything extends, so one invalidation after a write
 * refreshes the listing and every open collection together. A rename changes
 * both, and invalidating anything narrower would leave one of them showing the
 * old name.
 */

export const collectionKeys = {
	all: rootFor(PROJECTION, "collections"),
	lists: () => [...collectionKeys.all, "list"] as const,
	details: () => [...collectionKeys.all, "detail"] as const,
	detail: (id: string) => [...collectionKeys.details(), id] as const,
};

export const collectionsQueryOptions = () =>
	queryOptions({
		queryKey: collectionKeys.lists(),
		queryFn: () => listStudioCollections(),
		/*
		 * A minute. Definitions are inlined at build time and only membership
		 * moves, which changes when a sync runs - so refetching faster than that
		 * asks the same question of the same rows.
		 */
		staleTime: 60_000,
	});

export const collectionQueryOptions = (id: string) =>
	queryOptions({
		queryKey: collectionKeys.detail(id),
		queryFn: () => readStudioCollection({ data: { id } }),
		staleTime: 60_000,
	});
