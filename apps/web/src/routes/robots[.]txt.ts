import { renderRobots } from "@sushindustries/llms";
import { createFileRoute } from "@tanstack/react-router";
import { describeSite } from "../modules/content/llms.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * Everything is public and indexable except `/preview/*`, which exists only to
 * be loaded inside an iframe. Those pages are a component with no chrome, no
 * heading and no context — indexed, they would compete with the documentation
 * page that embeds them and win on nothing.
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
					disallow: ["/preview/"],
					indexPaths: ["/llms.txt", "/llms-full.txt"],
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
