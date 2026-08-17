import type { SiteDescription, SiteSection } from "@sushindustries/llms";
import { skills } from "../assistant/skills.server";
import { SITE } from "./site.catalogue";
import { sitePaths, siteSections } from "./site-index";

/*
 * What the assistant on this site can do, published.
 *
 * An `llms.txt` says what a site *is*. This says what it can be *asked to do*,
 * which is the half that matters to another assistant: knowing that
 * `find_component` exists and takes a query is the difference between reading
 * a page and using the site.
 *
 * Built from the same Markdown files the tools are built from, so the list
 * cannot describe a capability that is not wired up - `pnpm doctor` fails a
 * skill that is declared and unbound, and this reads the same declarations.
 */
function skillSection(): SiteSection {
	return {
		title: "Assistant skills",
		description:
			"What the assistant on the desktop at / can do. Each is a tool it calls on your behalf; the source of each declaration is packages/assistant/skills/.",
		entries: skills.map((skill) => ({
			/*
			 * The desktop, not `/assistant`: the assistant is a window on the desk
			 * with no route behind it (see shelf-page.tsx), and a published link
			 * that 404s teaches an agent to distrust the rest of the file.
			 */
			path: "/",
			title: skill.name,
			description: [
				skill.summary,
				skill.parameters.length > 0
					? `Takes ${skill.parameters
							.map(
								(parameter) =>
									`${parameter.name} (${parameter.type}${parameter.required ? "" : ", optional"})`,
							)
							.join(", ")}.`
					: "Takes no arguments.",
			].join(" "),
			/*
			 * Out of the sitemap: they are capabilities rather than pages, and
			 * every one of them would otherwise be a duplicate URL for /assistant.
			 */
			noindex: true,
		})),
	};
}

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
		title: SITE.name,
		summary:
			"Small packages, built carefully. A TanStack Start site and the component library it is made of.",
		framing:
			"Every component here is installable on its own, with either the TanStack CLI or shadcn. Component pages carry a live preview; the source of truth for each one is its package under packages/.",
		extraPaths: [...sitePaths()],
		sections: [
			...siteSections().map((section) => ({
				title: section.title,
				description: section.description,
				entries: section.entries.map((entry) => ({
					path: entry.path,
					title: entry.title,
					description: entry.description,
					body: entry.body,
				})),
			})),
			skillSection(),
		],
	};
}
