import { renderSitemapIndex } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { describeSite } from "../modules/content/llms.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * The sitemap index. The URL robots.txt has always pointed at, now answering
 * with a <sitemapindex> of per-section shards instead of one flat urlset, so
 * a crawler that saw one section change refetches one small file rather than
 * the whole roster. Built from the same description the plain-text files use,
 * so the shards cannot list a page they do not.
 */
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				return new Response(renderSitemapIndex(site), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
