import { createFileRoute } from "@tanstack/react-router";
import { toShadcnIndex } from "../../../modules/registry/registry.catalogue";
import { json, originFrom } from "../../../modules/registry/registry.server";

/*
 * The shadcn registry index.
 *
 * One line in a consumer's components.json makes this a named registry:
 *
 *   "registries": { "@adamjurek": "<this origin>/r/shadcn/{name}.json" }
 *
 * after which `pnpm dlx shadcn@latest add @adamjurek/consent` works, and so
 * does search. `/r/registry.json` next door is the TanStack add-on index -
 * same components, the other installer's shape - and this file exists because
 * the two formats will never agree on what an index is.
 */
export const Route = createFileRoute("/r/shadcn/registry.json")({
	server: {
		handlers: {
			GET: ({ request }) => json(toShadcnIndex(originFrom(request))),
		},
	},
});
