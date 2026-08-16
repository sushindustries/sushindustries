import type { SiteDescription } from "@sushindustries/llms";
import { sitePaths, siteSections } from "./site-index";

/*
 * This site, described for `@sushindustries/llms`.
 *
 * The rendering lives in the package; this is only the adapter that maps our
 * catalogues onto its shape. Keeping the two apart is what makes the package
 * worth publishing - nothing in it knows about registries, packages or posts.
 *
 * `.server.ts` because it is only ever called from a route handler. Nothing
 * here is privileged, but the suffix keeps request-shaped code from drifting
 * into a component.
 */
export function describeSite(origin: string): SiteDescription {
	return {
		origin,
		title: "Sushindustries",
		summary:
			"Small packages, built carefully. A TanStack Start site and the component library it is made of.",
		framing:
			"Every component here is installable on its own, with either the TanStack CLI or shadcn. Component pages carry a live preview; the source of truth for each one is its package under packages/.",
		extraPaths: [...sitePaths()],
		sections: siteSections().map((section) => ({
			title: section.title,
			description: section.description,
			entries: section.entries.map((entry) => ({
				path: entry.path,
				title: entry.title,
				description: entry.description,
				body: entry.body,
			})),
		})),
	};
}
