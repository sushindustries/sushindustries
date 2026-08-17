import { createFileRoute } from "@tanstack/react-router";
import { listRegistry } from "../../../../modules/registry/registry.catalogue";
import { json, originFrom } from "../../../../modules/registry/registry.server";

/*
 * The registry as data. The same objects the site renders, minus nothing:
 * an API that hides fields the page shows is two APIs, one of them ashamed.
 * Pro items appear here too - the blockade is on their files, not on the
 * fact of their existence.
 */
export const Route = createFileRoute("/api/v1/components/")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = originFrom(request);

				return json({
					total: listRegistry().length,
					components: listRegistry().map((item) => ({
						...item,
						url: `${origin}/components/${item.name}`,
						api: `${origin}/api/v1/components/${item.name}`,
					})),
				});
			},
		},
	},
});
