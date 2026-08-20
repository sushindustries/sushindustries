import { createFileRoute } from "@tanstack/react-router";
import { pageMarkdownResponse } from "../../modules/content/page-markdown.server";

/*
 * A component's Markdown mirror, which needs its own route now.
 *
 * `/$section/$slug/index.md` handles every other kind and used to handle this
 * one too. Then component sections became `/components/<slug>/<section>`, and
 * that route matches `/components/button/index.md` with `section` bound to
 * `index.md` - winning on the literal first segment, and answering 404 for a
 * mirror that had worked for months.
 *
 * A literal `index.md` in the third segment outranks a parameter there, which
 * is the same specificity rule read the other way, so this takes it back. The
 * handler is the shared one: what a mirror contains is the content module's
 * knowledge, and this route is URL structure and nothing else.
 */
export const Route = createFileRoute("/components/$slug/index.md")({
	server: {
		handlers: {
			GET: ({ request, params }) =>
				pageMarkdownResponse(request, `/components/${params.slug}`),
		},
	},
});
