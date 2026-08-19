import { createFileRoute } from "@tanstack/react-router";
import { pageMarkdownResponse } from "../modules/content/page-markdown.server";

/*
 * A listing's Markdown mirror. Static on purpose: a static segment is what
 * outranks the sibling `$slug` page route for this URL - see the note in
 * `$section.$slug.index[.]md.ts`.
 */
export const Route = createFileRoute("/index.md")({
	server: {
		handlers: {
			GET: ({ request }) => pageMarkdownResponse(request, "/"),
		},
	},
});
