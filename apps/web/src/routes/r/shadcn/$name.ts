import { createFileRoute } from "@tanstack/react-router";
import {
	atomsAsShadcn,
	findRegistryItem,
	toShadcn,
} from "../../../modules/registry/registry.catalogue";
import {
	json,
	notFoundJson,
	originFrom,
	paywalled,
} from "../../../modules/registry/registry.server";

/*
 * A shadcn registry item.
 *
 *   pnpm dlx shadcn@latest add https://<origin>/r/shadcn/scroll-spin.json
 *
 * Same source as the TanStack add-on beside it, different shape. shadcn asks
 * the consumer where files go and installs bare dependency names; the add-on
 * format decides the location and pins versions. Neither ecosystem will adopt
 * the other's format, and maintaining two copies of a component to satisfy two
 * installers is exactly how they drift.
 */
export const Route = createFileRoute("/r/shadcn/$name")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				const name = params.name.replace(/\.json$/, "");

				// The stylesheet is an item too - every component's payload
				// depends on it, so it answers at the same address scheme.
				if (name === "atoms") return json(atomsAsShadcn());

				const item = findRegistryItem(name);

				if (!item) return notFoundJson(`No component named "${name}"`);

				// The blockade: pro items exist in the registry but not here.
				if (item.access === "pro") return paywalled(name);

				return json(toShadcn(item, originFrom(request)));
			},
		},
	},
});
