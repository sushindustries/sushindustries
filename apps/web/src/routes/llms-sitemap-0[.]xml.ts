import { renderUrlset, sitemapShards } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { originFrom } from "../modules/registry/registry.server";
import { describeSite } from "../modules/seo/llms.server";

/*
 * Every Markdown mirror, as a urlset: each page the HTML sitemap lists, with
 * `index.md` appended, plus the two plain-text indexes. Derived from the same
 * shards as /sitemap.xml, so a page cannot be in one roster and not the other.
 */
export const Route = createFileRoute("/llms-sitemap-0.xml")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				const mirrors = sitemapShards(site)
					.flatMap((shard) => shard.paths)
					.map((path) => (path === "/" ? "/index.md" : `${path}/index.md`));

				const body = renderUrlset(site.origin, [
					...mirrors,
					"/llms.txt",
					"/llms-full.txt",
				]);

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
