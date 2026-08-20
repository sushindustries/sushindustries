import { createFileRoute } from "@tanstack/react-router";
import { shapeProxy } from "../../modules/sync/proxy.server";

/*
 * The Electric shape for one page's votes.
 *
 * Everything about how a shape is proxied safely lives in
 * `../../modules/sync` - the parameter allowlist, the server-side table and
 * filter, the two headers `fetch` leaves lying about the body. What is left
 * here is the only part that is about *this* endpoint: which table, which
 * filter, and where the value for it comes from.
 *
 * No bearer check, deliberately. A page's votes are shown on the page. The
 * proxy is not hiding this data - it is stopping this endpoint from being a
 * way to ask for other data.
 */
const votes = shapeProxy({
	table: "page_feedback",
	where: "page = $1",
	params: (request) => {
		const page = new URL(request.url).searchParams.get("page");
		// No page is no scope, and the proxy answers 400 rather than
		// streaming the whole table to somebody who did not name one.
		return page ? [page] : null;
	},
});

export const Route = createFileRoute("/api/feedback/shape")({
	server: { handlers: { GET: ({ request }) => votes(request) } },
});
