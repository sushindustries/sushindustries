import { renderRobots } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { originFrom } from "../modules/registry/registry.server";
import { describeSite } from "../modules/seo/llms.server";

/*
 * Everything is public and indexable except `/preview/*`, which exists only to
 * be loaded inside an iframe. Those pages are a component with no chrome, no
 * heading and no context - indexed, they would compete with the documentation
 * page that embeds them and win on nothing.
 *
 * `/mcp` is disallowed for a different reason. It is not secret - it answers a
 * GET with its own instructions - but it is bearer-only, so every crawl of it
 * is a 401 that teaches nothing, and it is deliberately not advertised while
 * it is still private.
 *
 * The content signal is set deliberately rather than left out. This is a
 * portfolio: being read, searched and quoted is the entire point, so all three
 * are yes.
 */
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const site = describeSite(originFrom(request));

				const body = renderRobots(site, {
					disallow: ["/preview/", "/mcp"],
					indexPaths: [
						"/llms.txt",
						"/llms-full.txt",
						"/llms-sitemap-index.xml",
					],
					contentSignal: { aiTrain: true, search: true, aiInput: true },
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
