import { renderSitemap } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { describeSite } from "../modules/content/llms.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * Built from the same description the plain-text files use, so the sitemap
 * cannot list a page they do not.
 */
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				return new Response(renderSitemap(site), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
