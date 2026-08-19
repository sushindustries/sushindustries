import { createFileRoute } from "@tanstack/react-router";
import {
	agentPrompt,
	componentPrompt,
	markdown,
	notFoundMarkdown,
} from "../../../modules/registry/agent-setup.server";
import { findRegistryItem } from "../../../modules/registry/registry.catalogue";
import { originFrom } from "../../../modules/registry/registry.server";

/*
 * Agent setup instructions for one component, as Markdown at a URL.
 *
 *   Fetch and execute the appropriate instructions to set me up with
 *   Showcase from https://<origin>/r/prompt/showcase.md
 *
 * The person copies that sentence; the agent fetches this. A server route
 * rather than an artefact for the same reason the installers are: the
 * registry entry is the only source, and the document is rendered from it on
 * request, so nothing exists to drift.
 *
 * Flat `$name.ts` - a dynamic segment never becomes a directory.
 */
export const Route = createFileRoute("/r/prompt/$name")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				const name = params.name.replace(/\.md$/, "");
				const item = findRegistryItem(name);

				if (!item) return notFoundMarkdown(`No component named "${name}".`);

				const origin = originFrom(request);
				const body = [
					componentPrompt(item, origin),
					"---",
					"",
					"The one-line prompt that points here, for reuse:",
					"",
					"```text",
					agentPrompt(item.title, `${origin}/r/prompt/${item.name}`),
					"```",
					"",
				].join("\n");

				return markdown(body);
			},
		},
	},
});
