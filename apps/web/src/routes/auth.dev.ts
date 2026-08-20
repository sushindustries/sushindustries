import { createFileRoute } from "@tanstack/react-router";
import { sessionCookie } from "../modules/access/github-auth.server";
import { REPO_SLUG } from "../modules/content/repo";

/*
 * Signing in on a laptop, without GitHub.
 *
 * GitHub allows one callback URL per OAuth app, and this repo's app points at
 * the deployment. So signing in locally means either a second OAuth app or
 * this - and a second app to look at a table on your own machine is a poor
 * trade.
 *
 * It is a door, so it is worth being exact about what closes it. Two
 * conditions, both required, and neither is anything a caller sends:
 *
 *   1. `DEV_SIGNIN` is set. Opt-in, so this is off unless somebody typed it,
 *      and typing it into a production environment is a deliberate act rather
 *      than an oversight.
 *   2. The request arrived on localhost. A dev server bound to 0.0.0.0 is
 *      reachable from whatever network the laptop is on, and "somebody set a
 *      variable" is not the same as "only I can reach it".
 *
 * The first version of this checked `NODE_ENV !== "production"` instead, and
 * that check was dead code: Vite inlines `process.env.NODE_ENV` at build time,
 * so the built server had the literal `"production"` compiled in and the route
 * answered 404 no matter what the process environment said. It looked like a
 * working guard and was an unconditional one. An opt-in variable is not
 * inlined, which is the property that makes this checkable at all.
 *
 * A test asserts the route is closed without the variable. If that test ever
 * goes green for the wrong reason, delete this file rather than repair it.
 */

/** The one login it will issue, which is the one the studio lets through. */
const OWNER = REPO_SLUG.split("/")[0] ?? "";

function permitted(request: Request): boolean {
	if (!process.env.DEV_SIGNIN) return false;

	const { hostname } = new URL(request.url);
	return (
		hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
	);
}

export const Route = createFileRoute("/auth/dev")({
	server: {
		handlers: {
			GET: ({ request }) => {
				if (!permitted(request)) {
					/*
					 * 404 rather than 403. A 403 confirms the route exists, and there
					 * is nothing to gain from telling anybody that.
					 */
					return new Response("Not found", {
						status: 404,
						headers: { "content-type": "text/plain; charset=utf-8" },
					});
				}

				return new Response(null, {
					status: 302,
					headers: {
						location: "/studio",
						// `secure: false` - this only ever runs over http on localhost,
						// and a Secure cookie would be dropped there.
						"set-cookie": sessionCookie(OWNER, false),
					},
				});
			},
		},
	},
});
