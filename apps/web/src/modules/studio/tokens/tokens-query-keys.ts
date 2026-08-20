import { queryOptions } from "@tanstack/react-query";
import { ACCESS, rootFor } from "../studio.cache";
import { listStudioTokens } from "./tokens.functions";

/*
 * One key, and the options built on it.
 *
 * Smaller than the other features' because there is only one query: a token has
 * no detail view, by design - everything about it that can be shown is already
 * in the listing, and the part that is not shown is the part nothing may fetch
 * twice.
 *
 * `staleTime: 0`. Every other section caches for a minute because its rows come
 * from a projection that only moves when a sync runs. These rows move when
 * somebody revokes something, and a revocation that appears to have not
 * happened is the one stale read in this studio that actually frightens me.
 */

export const tokenKeys = {
	all: rootFor(ACCESS, "tokens"),
	lists: () => [...tokenKeys.all, "list"] as const,
};

export const tokensQueryOptions = () =>
	queryOptions({
		queryKey: tokenKeys.lists(),
		queryFn: () => listStudioTokens(),
		staleTime: 0,
	});
