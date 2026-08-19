/*
 * One origin, and the other one points at it.
 *
 * A host and its `www.` twin both resolve, and serving the same page from two
 * addresses is two pages as far as a crawler is concerned -
 * split link equity, duplicate results, and a canonical tag doing repair work
 * a redirect does better. Railway has no redirect rules, so the redirect is
 * the application's job.
 *
 * The canonical origin is passed in rather than read from a module here, so
 * the site that owns the URL keeps owning it and this stays installable. Only
 * the `www.` twin of that host redirects: localhost and a platform's own
 * service domain stay reachable as themselves, because a health check that
 * gets a 301 to another host is not checking that deployment.
 *
 * 301 and not 308: a site answering GET gains nothing from method
 * preservation, and permanent-redirect is the signal search engines have
 * honoured longest.
 */

/**
 * The redirect a request must take, or nothing when it is already home.
 *
 * @param origin the canonical absolute origin, e.g. `https://example.com`
 */
export function canonicalRedirect(
	request: Request,
	origin: string,
): Response | undefined {
	const canonical = new URL(origin);
	const url = new URL(request.url);

	if (url.host !== `www.${canonical.host}`) return undefined;

	url.protocol = canonical.protocol;
	url.host = canonical.host;

	return new Response(null, {
		status: 301,
		headers: {
			location: url.toString(),
			/*
			 * A day at the edge and in the browser: the redirect is static
			 * fact, and caching it means the second visit never even asks.
			 */
			"cache-control": "public, max-age=86400",
		},
	});
}
