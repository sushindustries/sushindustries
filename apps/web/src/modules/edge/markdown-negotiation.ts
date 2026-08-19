/*
 * `Accept: text/markdown` for a component or package page, negotiated to the
 * Markdown source that already exists for it.
 *
 * TanStack Start's own document handler cannot answer this - it 500s (see
 * `start.ts`) for any `Accept` that excludes the wildcard and `text/html`,
 * because a document route only ever renders HTML. The Markdown itself
 * already exists at a URL of its own, `/r/md/<slug>` and
 * `/r/md/packages/<slug>` - built for "View as Markdown" and for agents that
 * already know to ask for it there. This is the other half: a client that
 * asks the *page's own* URL for `text/markdown`, the way content negotiation
 * is meant to work, gets redirected to the representation that answers it,
 * rather than a 406 telling it no such representation exists when one does.
 *
 * A redirect rather than serving the body inline at the page's URL, on
 * purpose: the Markdown response is already a real, tested route with its
 * own headers and its own `notFoundMarkdown` fallback, and reaching it
 * through `next()` far downstream inside a request-middleware would mean
 * either duplicating that logic or reconstructing a fetch to the same
 * server - a redirect gets the one correct response for free.
 *
 * Posts and built pages have no `/r/md/*` counterpart yet, so they are not
 * matched here - the honest answer for them is still the 406 `start.ts`
 * already gives an unsupported `Accept`, not a guess at a shape nothing
 * renders.
 */

const NEGOTIABLE = [
	{
		page: /^\/components\/([\w-]+)\/?$/,
		markdown: (slug: string) => `/r/md/${slug}`,
	},
	{
		page: /^\/packages\/([\w-]+)\/?$/,
		markdown: (slug: string) => `/r/md/packages/${slug}`,
	},
] as const;

export function markdownRedirect(request: Request): Response | undefined {
	const accept = request.headers.get("accept") ?? "";
	if (!accept.includes("text/markdown")) return undefined;

	const { pathname } = new URL(request.url);

	for (const { page, markdown } of NEGOTIABLE) {
		const match = page.exec(pathname);
		if (!match?.[1]) continue;

		return new Response(null, {
			status: 302,
			headers: {
				location: markdown(match[1]),
				vary: "accept",
			},
		});
	}

	return undefined;
}
