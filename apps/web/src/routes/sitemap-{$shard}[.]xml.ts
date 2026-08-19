import { renderSitemapShard } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { describeSite } from "../modules/content/llms.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * One shard of the sitemap index, one per site section.
 *
 * A single parameterised route rather than a file per shard: the shard list
 * is derived from the site description, so a new section starts answering
 * here the moment the index advertises it, with no route to remember.
 */
export const Route = createFileRoute("/sitemap-{$shard}.xml")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				// Anything non-numeric is a URL nobody was given.
				if (!/^\d+$/.test(params.shard)) {
					return new Response("Not found\n", { status: 404 });
				}

				const site = describeSite(originFrom(request));
				const body = renderSitemapShard(site, Number(params.shard));

				if (!body) return new Response("Not found\n", { status: 404 });

				return new Response(body, {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
