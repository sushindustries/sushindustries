import { createFileRoute } from "@tanstack/react-router";
import { previewInvite } from "../modules/access/access.functions";
import { RedeemView } from "../modules/access/redeem-view";

/*
 * Where an invitation link lands.
 *
 * The one page in this application a stranger is meant to reach. Everything
 * else that touches the access domain is behind the studio session; this is
 * open, because the person collecting a token is by definition not signed in,
 * and the link they are holding is the whole of their authorisation.
 *
 * A flat dotted file with the dynamic segment in the name, per the routes
 * rule. `$key` is the link secret, which is in the path rather than a query
 * string on purpose: query strings survive in referrer headers and analytics
 * in ways path segments mostly do not, and this site sends
 * `strict-origin-when-cross-origin` either way.
 *
 * The loader previews and never redeems. That distinction is the whole
 * defence against mail scanners: a GET tells you what the link would do, and
 * only the button on the page spends it.
 */
export const Route = createFileRoute("/access/$key")({
	loader: async ({ params }) => ({
		invite: await previewInvite({ data: { key: params.key } }),
	}),

	component: Redeem,

	head: () => ({
		meta: [
			{ title: "Your access · adamjurek.com" },
			/*
			 * Never indexed, and never followed. A crawler that reached one of
			 * these would be a crawler holding a live credential, and one that
			 * followed the button would spend it.
			 */
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function Redeem() {
	const { invite } = Route.useLoaderData();
	const { key } = Route.useParams();

	return <RedeemView invite={invite} invitationKey={key} />;
}
