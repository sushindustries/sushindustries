import { createFileRoute } from "@tanstack/react-router";
import { pageMarkdownResponse } from "../modules/content/page-markdown.server";

/*
 * Every entry page's Markdown mirror, one route: `/components/button/index.md`,
 * `/p/privacy/index.md` and the rest all land here. Which paths are pages is
 * the content module's knowledge - an unknown one comes back as the Markdown
 * 404 - so this route stays what a route is supposed to be here: URL
 * structure, nothing else.
 *
 * The root and section listings cannot join in: `/components/index.md` is two
 * segments, and the page route `/components/$slug` outranks any route that
 * would need `index.md` bound to a parameter. Their mirrors are the static
 * `index[.]md.ts` files, which outrank `$slug` the other way.
 */
export const Route = createFileRoute("/$section/$slug/index.md")({
	server: {
		handlers: {
			GET: ({ request, params }) =>
				pageMarkdownResponse(request, `/${params.section}/${params.slug}`),
		},
	},
});
