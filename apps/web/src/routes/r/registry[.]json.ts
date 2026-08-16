import { createFileRoute } from "@tanstack/react-router";
import { toRegistryIndex } from "../../modules/registry/registry.catalogue";
import { json, originFrom } from "../../modules/registry/registry.server";

/*
 * The TanStack CLI add-on index.
 *
 *   tanstack create my-app --add-ons https://<origin>/r/registry.json
 *   export CTA_REGISTRY=https://<origin>/r/registry.json
 *
 * A server route rather than a server function: the caller is somebody else's
 * CLI, which wants a URL and a JSON body and knows nothing about our RPC
 * protocol. That is the HTTP-semantics justification server routes are for.
 *
 * The dots in the filename are escaped as `[.]` so the router treats
 * `registry.json` as one path segment instead of nesting a `json` route
 * under a `registry` one.
 */
export const Route = createFileRoute("/r/registry.json")({
	server: {
		handlers: {
			GET: ({ request }) => json(toRegistryIndex(originFrom(request))),
		},
	},
});
