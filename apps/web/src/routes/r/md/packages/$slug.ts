import { createFileRoute } from "@tanstack/react-router";
import { findPackage } from "../../../../modules/content/packages/packages.catalogue";
import {
	markdown,
	notFoundMarkdown,
} from "../../../../modules/registry/agent-setup.server";

/*
 * A package's README as Markdown.
 *
 *   /r/md/packages/ui.md
 *
 * The sibling of `/r/md/<component>`, for the other half of the catalogue.
 * Package pages used to offer their source as a GitHub blob URL, which is a
 * 404 for every visitor while the repo is private - and would stay a link
 * into someone else's site even after it opens.
 *
 * Serving it here costs nothing: the catalogue already inlines every README at
 * build time to render the page, so this hands back the exact text the page
 * was built from rather than a second copy that can drift.
 */
export const Route = createFileRoute("/r/md/packages/$slug")({
	server: {
		handlers: {
			GET: ({ params }) => {
				const slug = params.slug.replace(/\.md$/, "");
				const entry = findPackage(slug);

				if (!entry) return notFoundMarkdown(`No package named "${slug}".`);

				return markdown(entry.readme);
			},
		},
	},
});
