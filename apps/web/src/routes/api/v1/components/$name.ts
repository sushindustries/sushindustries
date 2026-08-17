import { createFileRoute } from "@tanstack/react-router";
import { findRegistryItem } from "../../../../modules/registry/registry.catalogue";
import {
	json,
	notFoundJson,
	originFrom,
} from "../../../../modules/registry/registry.server";

/* One item, with every address it answers at. Flat `$name.ts`, as always. */
export const Route = createFileRoute("/api/v1/components/$name")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				const item = findRegistryItem(params.name);
				if (!item) return notFoundJson(`No component named "${params.name}"`);

				const origin = originFrom(request);

				return json({
					...item,
					url: `${origin}/components/${item.name}`,
					markdown: `${origin}/r/md/${item.name}`,
					prompt: `${origin}/r/prompt/${item.name}`,
					install: {
						tanstack: `${origin}/r/tanstack/${item.name}.json`,
						shadcn: `${origin}/r/shadcn/${item.name}.json`,
					},
				});
			},
		},
	},
});
