import { createFileRoute } from "@tanstack/react-router";
import {
	clearCookie,
	githubConfigured,
	openSession,
} from "../modules/content/github-auth.server";
import { refuse } from "../modules/content/mcp-auth.server";
import { studioReport } from "../modules/content/studio.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * The state of the projection, for whoever owns it.
 *
 * Not Drizzle Studio. That is a read-write database client in beta, and
 * putting one on a public origin is a different risk from anything else here -
 * a bug in it is a bug in production data. This is the question Studio was
 * being used to answer instead: what is in there, how old is it, and did the
 * last sync do what it was supposed to. Read-only, one query, no client.
 *
 * `pnpm sushindustries studio` remains the way to actually browse and edit
 * rows, over the TCP proxy, from a machine that is already trusted.
 *
 * Two ways in, and the order matters. A GitHub session is the intended one and
 * names a person. The bearer token is the fallback so this works before an
 * OAuth app exists, and because a script has no browser to sign in with.
 */
export const Route = createFileRoute("/studio")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const origin = originFrom(request);
				const session = openSession(request);

				if (!session) {
					// No session: a token will do, and if there is not one either,
					// say how to sign in rather than returning a bare 401.
					const refused = refuse(request);
					if (refused) return signIn(origin, refused.status);
				}

				const report = await studioReport();
				const body = JSON.stringify(
					{ signedInAs: session?.login ?? "bearer token", ...report },
					null,
					"\t",
				);

				return new Response(body, {
					headers: {
						"content-type": "application/json; charset=utf-8",
						// Never cached anywhere. It is per-viewer and it is production.
						"cache-control": "no-store, private",
					},
				});
			},

			/* Signing out is a write, so it is a POST. */
			POST: ({ request }) =>
				new Response(null, {
					status: 302,
					headers: {
						location: "/",
						"set-cookie": clearCookie(originFrom(request).startsWith("https")),
					},
				}),
		},
	},
});

/** What to say to somebody who has not signed in. */
function signIn(origin: string, status: number): Response {
	const lines = [
		"The studio shows the state of the deployed projection.",
		"",
		githubConfigured()
			? `Sign in with GitHub:  ${origin}/auth/github`
			: "GitHub sign-in is not configured on this deployment.",
		"",
		"Or send the bearer token:",
		`  curl -H "Authorization: Bearer $MCP_AUTH_TOKEN" ${origin}/studio`,
		"",
		"To browse and edit rows rather than read a summary:",
		"  pnpm sushindustries studio",
		"",
	];

	return new Response(lines.join("\n"), {
		status,
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}
