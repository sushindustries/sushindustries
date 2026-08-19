/*
 * `Accept: text/markdown` for any page, negotiated to the Markdown mirror
 * that exists for it.
 *
 * TanStack Start's own document handler cannot answer this - it 500s (see
 * `start.ts`) for any `Accept` that excludes the wildcard and `text/html`,
 * because a document route only ever renders HTML. But every page has a
 * Markdown mirror at its own path plus `index.md`, so a client that asks the
 * page's URL for `text/markdown`, the way content negotiation is meant to
 * work, gets redirected to the representation that answers it, rather than a
 * 406 telling it no such representation exists when one does.
 *
 * A redirect rather than serving the body inline at the page's URL, on
 * purpose: the mirror is a real, tested route with its own headers and its
 * own `notFoundMarkdown` fallback, and reaching it through `next()` far
 * downstream inside a request-middleware would mean either duplicating that
 * logic or reconstructing a fetch to the same server - a redirect gets the
 * one correct response for free. A page that does not exist redirects to a
 * mirror that answers 404 in Markdown, which is still the honest answer in
 * the representation the client asked for.
 */

/*
 * Not pages, so not negotiable: machine endpoints answer every `Accept`
 * themselves, and anything with an extension already names its format.
 */
const NOT_PAGES = /^\/(?:r|api|preview|ingest|health|\.well-known)(?:\/|$)|\./;

export function markdownRedirect(request: Request): Response | undefined {
	const accept = request.headers.get("accept") ?? "";
	if (!accept.includes("text/markdown")) return undefined;

	const { pathname } = new URL(request.url);
	if (NOT_PAGES.test(pathname)) return undefined;

	const page = pathname.replace(/\/+$/, "");

	return new Response(null, {
		status: 302,
		headers: {
			location: `${page}/index.md`,
			vary: "accept",
		},
	});
}
