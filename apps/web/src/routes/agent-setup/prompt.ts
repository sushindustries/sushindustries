import { createFileRoute } from "@tanstack/react-router";
import { listPackages } from "../../modules/content/packages/packages.catalogue";
import { markdown } from "../../modules/registry/agent-setup.server";
import { listRegistry } from "../../modules/registry/registry.catalogue";
import { originFrom } from "../../modules/registry/registry.server";

/*
 * The whole site's agent setup, at the address the pattern made canonical:
 *
 *   Fetch and execute the appropriate instructions to set me up for
 *   sushindustries from https://<origin>/agent-setup/prompt
 *
 * This document routes: it tells the agent what exists and where each thing's
 * own instructions are, rather than inlining all of them. An agent setting up
 * one component fetches two small documents instead of one enormous one.
 */
export const Route = createFileRoute("/agent-setup/prompt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = originFrom(request);

				const body = [
					"# Set up sushindustries",
					"",
					"You are configuring the current project to use components or packages from sushindustries.",
					"Actions this document asks of you: **read**, then follow one link and **install**.",
					"",
					"## Decide what is being installed",
					"",
					"- A **component** is source copied into the project (TanStack CLI or shadcn), styled by atomic classes from `@sushindustries/atoms`.",
					"- A **package** is installed from npm and used as a dependency.",
					"",
					"Ask the user if it is not obvious from their request.",
					"",
					"## Components",
					"",
					"Each component's own instructions live at `" +
						origin +
						"/r/prompt/<name>`:",
					"",
					...listRegistry().map(
						(item) =>
							`- \`${item.name}\` - ${item.description} → ${origin}/r/prompt/${item.name}`,
					),
					"",
					"## Packages",
					"",
					"Each package's own instructions live at `" +
						origin +
						"/r/prompt/packages/<name>`:",
					"",
					...listPackages().map(
						(pkg) =>
							`- \`${pkg.name}\` - ${pkg.description} → ${origin}/r/prompt/packages/${pkg.slug}`,
					),
					"",
					"## Ground rules",
					"",
					"- The stylesheet is loaded once, globally: `@sushindustries/atoms/atoms.css`. Skipping it is the only common failure.",
					"- Versions in the instructions are the verified ones. Do not silently upgrade them.",
					"- If something does not fit the project, stop and tell the user rather than forcing it.",
					"",
				].join("\n");

				return markdown(body);
			},
		},
	},
});
