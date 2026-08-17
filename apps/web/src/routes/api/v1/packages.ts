import { createFileRoute } from "@tanstack/react-router";
import { listPackages } from "../../../modules/content/packages/packages.catalogue";
import { json, originFrom } from "../../../modules/registry/registry.server";

/* The packages index as data, from the same catalogue the pages read. */
export const Route = createFileRoute("/api/v1/packages")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = originFrom(request);

				return json({
					total: listPackages().length,
					packages: listPackages().map((pkg) => ({
						...pkg,
						url: `${origin}/packages/${pkg.slug}`,
						prompt: `${origin}/r/prompt/packages/${pkg.slug}`,
					})),
				});
			},
		},
	},
});
