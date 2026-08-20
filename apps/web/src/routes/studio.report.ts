import { createFileRoute } from "@tanstack/react-router";
import { openSession } from "../modules/content/github-auth.server";
import { refuse } from "../modules/content/mcp-auth.server";
import { studioReport } from "../modules/studio/overview/overview.server";

/*
 * The same report, as JSON.
 *
 * `/studio` is a page because the answer is a set of tables somebody reads.
 * This is the same data for something that does not read - a script, a
 * dashboard, a check in CI - and it takes the bearer token, because a script
 * has no browser to sign in with.
 *
 * A session works too, so opening this in a tab after signing in shows the
 * shape the page is built from. That is worth having: a table that disagrees
 * with its own source is easier to find when you can put them side by side.
 */
export const Route = createFileRoute("/studio/report")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!openSession(request)) {
					const refused = await refuse(request, "studio:read");
					if (refused) return refused;
				}

				return new Response(
					`${JSON.stringify(await studioReport(), null, "\t")}\n`,
					{
						headers: {
							"content-type": "application/json; charset=utf-8",
							// Per-viewer and production. Never cached anywhere.
							"cache-control": "no-store, private",
						},
					},
				);
			},
		},
	},
});
