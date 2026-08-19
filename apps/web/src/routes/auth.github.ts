import { createFileRoute } from "@tanstack/react-router";
import {
	authorizeUrl,
	githubConfigured,
} from "../modules/content/github-auth.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * The start of signing in: a redirect to GitHub, and nothing else.
 *
 * A server route because it answers with a 302 and no body, which is HTTP
 * semantics rather than a page.
 */
export const Route = createFileRoute("/auth/github")({
	server: {
		handlers: {
			GET: ({ request }) => {
				if (!githubConfigured()) {
					return new Response(
						"GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
						{
							status: 503,
							headers: { "content-type": "text/plain; charset=utf-8" },
						},
					);
				}

				const origin = originFrom(request);
				const { url, state } = authorizeUrl(origin);

				/*
				 * The state travels in a short cookie rather than in memory, because
				 * the callback can land on a different instance than this request
				 * did and a value held in a module would be missing there.
				 */
				return new Response(null, {
					status: 302,
					headers: {
						location: url,
						"set-cookie": `sushi-oauth-state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${origin.startsWith("https") ? "; Secure" : ""}`,
					},
				});
			},
		},
	},
});
