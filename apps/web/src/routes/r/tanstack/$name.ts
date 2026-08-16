import { createFileRoute } from "@tanstack/react-router";
import {
	findRegistryItem,
	toTanStackAddOn,
} from "../../../modules/registry/registry.catalogue";
import {
	json,
	notFoundJson,
	originFrom,
} from "../../../modules/registry/registry.server";

/*
 * A compiled TanStack CLI add-on.
 *
 *   tanstack add https://<origin>/r/tanstack/scroll-spin.json
 *
 * One JSON document with every file inlined. The CLI fetches a single URL and
 * writes what it finds, so there is nothing to build and nothing else to host
 * - which is why this is a route rather than an artefact.
 *
 * Flat `$name.ts`, not a `$name/` directory: converting a dynamic segment to a
 * route directory breaks URL matching.
 */
export const Route = createFileRoute("/r/tanstack/$name")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				// The `.json` the CLI asks for is part of the URL, not the id.
				const name = params.name.replace(/\.json$/, "");
				const item = findRegistryItem(name);

				if (!item) return notFoundJson(`No add-on named "${name}"`);

				return json(toTanStackAddOn(item, originFrom(request)));
			},
		},
	},
});
