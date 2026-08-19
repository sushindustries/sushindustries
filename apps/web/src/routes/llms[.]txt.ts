import { renderLlmsIndex } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { describeSite } from "../modules/content/llms.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * The machine-readable page index.
 *
 * A server route because the caller is a crawler or an assistant, which wants
 * a URL and a body and knows nothing about this app's RPC - the HTTP-semantics
 * justification server routes are reserved for.
 *
 * Dots escaped as `[.]` so the router treats `llms.txt` as one segment rather
 * than nesting a `txt` route under an `llms` one.
 */
export const Route = createFileRoute("/llms.txt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				const body = renderLlmsIndex(site, {
					title: "Full text",
					entries: [
						{
							path: "/llms-full.txt",
							title: "Everything, inlined",
							description: "Every page above with its text, in one file",
						},
					],
				});

				return new Response(body, {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
