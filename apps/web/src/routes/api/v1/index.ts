import { createFileRoute } from "@tanstack/react-router";
import { json, originFrom } from "../../../modules/registry/registry.server";

/*
 * The API's front door, and its own documentation.
 *
 * `/api/v1` describes every endpoint under it, so the API is discoverable by
 * fetching its root - the same principle as `/agent-setup/prompt`, in JSON.
 * Versioned in the path from day one, because the first breaking change is
 * the wrong moment to invent versioning.
 *
 * Everything under `v1` is read-only public data rendered from the same
 * catalogues the pages use. Mutations stay outside it (`/api/feedback`) until
 * they have auth to wear.
 */
export const Route = createFileRoute("/api/v1/")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = originFrom(request);

				return json({
					name: "sushindustries API",
					version: "v1",
					documentation: `${origin}/p/api`,
					endpoints: {
						components: {
							url: `${origin}/api/v1/components`,
							description:
								"Every registry item: name, title, version, kind, category, tags, files, dependencies.",
						},
						component: {
							url: `${origin}/api/v1/components/{name}`,
							description: "One registry item by name.",
						},
						packages: {
							url: `${origin}/api/v1/packages`,
							description:
								"Every published package: name, version, description.",
						},
					},
					related: {
						install: `${origin}/r/registry.json`,
						agents: `${origin}/agent-setup/prompt`,
						llms: `${origin}/llms.txt`,
					},
				});
			},
		},
	},
});
