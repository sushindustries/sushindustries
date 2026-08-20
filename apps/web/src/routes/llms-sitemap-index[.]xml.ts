import { renderSitemapIndex } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { originFrom } from "../modules/registry/registry.server";
import { describeSite } from "../modules/seo/llms.server";

/*
 * The sitemap of the machine-readable surfaces, same index-into-shards shape
 * as /sitemap.xml. Separate from it on purpose: search crawlers get pages,
 * assistants get the Markdown mirrors, and neither wastes a fetch on the
 * other's list.
 */
export const Route = createFileRoute("/llms-sitemap-index.xml")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				return new Response(renderSitemapIndex(site, ["/llms-sitemap-0.xml"]), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
