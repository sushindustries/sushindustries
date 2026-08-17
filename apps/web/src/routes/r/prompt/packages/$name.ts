import { createFileRoute } from "@tanstack/react-router";
import { findPackage } from "../../../../modules/content/packages/packages.catalogue";
import {
	agentPrompt,
	markdown,
	notFoundMarkdown,
	packagePrompt,
} from "../../../../modules/registry/agent-setup.server";
import { originFrom } from "../../../../modules/registry/registry.server";

/*
 * Agent setup for a whole package. Separate from `/r/prompt/$name` because a
 * package and a component may share a slug - `product-viewer` is both - and
 * "install from npm" and "copy these files in" are different instructions.
 */
export const Route = createFileRoute("/r/prompt/packages/$name")({
	server: {
		handlers: {
			GET: ({ request, params }) => {
				const name = params.name.replace(/\.md$/, "");
				const pkg = findPackage(name);

				if (!pkg) return notFoundMarkdown(`No package named "${name}".`);

				const origin = originFrom(request);
				const body = [
					packagePrompt(pkg, origin),
					"---",
					"",
					"The one-line prompt that points here, for reuse:",
					"",
					"```text",
					agentPrompt(pkg.name, `${origin}/r/prompt/packages/${pkg.slug}`),
					"```",
					"",
				].join("\n");

				return markdown(body);
			},
		},
	},
});
