import { createFileRoute } from "@tanstack/react-router";
import { findComponentPage } from "../../../modules/content/components/component-page";
import {
	markdown,
	notFoundMarkdown,
} from "../../../modules/registry/agent-setup.server";
import {
	findDemoSource,
	hasDemo,
} from "../../../modules/showcase/demo-sources";

/*
 * A component page as the Markdown it is made of.
 *
 *   /r/md/showcase.md
 *
 * "View as Markdown" for people, and the readable form for agents - the same
 * sections the HTML page renders, in source order, without the chrome. Served
 * from the same `findComponentPage` the page route uses, so the two cannot
 * disagree about what the page says.
 */
export const Route = createFileRoute("/r/md/$name")({
	server: {
		handlers: {
			GET: ({ params }) => {
				const name = params.name.replace(/\.md$/, "");
				const doc = findComponentPage(
					name,
					hasDemo,
					(id) => findDemoSource(id)?.source,
				);

				if (!doc) return notFoundMarkdown(`No component named "${name}".`);

				const body = [
					`# ${doc.title}`,
					"",
					doc.summary,
					"",
					...doc.sections.flatMap((section) => [
						doc.sections.length > 1 ? `## ${section.label}` : "",
						"",
						section.body,
						"",
					]),
				].join("\n");

				return markdown(body);
			},
		},
	},
});
