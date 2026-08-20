import { createFileRoute } from "@tanstack/react-router";
import { InvitesPanel } from "../modules/studio/invites/invites-panel";
import { invitesQueryOptions } from "../modules/studio/invites/invites-query-keys";

/*
 * Invites: giving somebody a token without ever holding it.
 *
 * The loader prefetches the listing and returns nothing, like every other
 * section. Safe through SSR for the same reason the tokens listing is: a
 * summary carries an address, a state and a prefix, and never the link - the
 * link exists in the response to the one POST that created it and nowhere
 * else, including here.
 */
export const Route = createFileRoute("/studio/invites")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(invitesQueryOptions()),
	component: InvitesPanel,
	head: () => ({
		meta: [
			{ title: "Invites · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
