import { queryOptions } from "@tanstack/react-query";
import { ACCESS, rootFor } from "../studio.cache";
import { listStudioInvites } from "./invites.functions";

/*
 * One key, and the options built on it.
 *
 * `staleTime: 0`, like the tokens listing and for a sharper version of the
 * same reason: an invitation is only interesting while it is uncollected, and
 * that state changes without anybody in this browser doing anything. Somebody
 * else follows the link, and the row means something different. A cached
 * listing would show an invitation as waiting after it had already been spent.
 *
 * `refetchInterval` is deliberately not set. A listing that polls is a listing
 * that keeps a laptop awake to watch a row that changes once, and the refresh
 * button in the Workbench is a person deciding to look.
 */

export const inviteKeys = {
	all: rootFor(ACCESS, "invites"),
	lists: () => [...inviteKeys.all, "list"] as const,
};

export const invitesQueryOptions = () =>
	queryOptions({
		queryKey: inviteKeys.lists(),
		queryFn: () => listStudioInvites(),
		staleTime: 0,
	});
