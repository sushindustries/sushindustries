import { renderLlmsFull } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { originFrom } from "../modules/registry/registry.server";
import { describeSite } from "../modules/seo/llms.server";

/*
 * The same index with every page's text inlined, so a reader that needs the
 * content does not make one request per page.
 */
export const Route = createFileRoute("/llms-full.txt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));
				const body = renderLlmsFull(site, { indexPath: "/llms.txt" });

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
