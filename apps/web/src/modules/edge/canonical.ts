import { SITE } from "../content/site.catalogue";

/*
 * One origin, and the other one points at it.
 *
 * Both `adamjurek.com` and `www.adamjurek.com` resolve here, and serving the
 * same page from two addresses is two pages as far as a crawler is concerned -
 * split link equity, duplicate results, and a canonical tag doing repair work
 * a redirect does better. Railway has no redirect rules, so the redirect is
 * the application's job.
 *
 * Derived from `SITE.url` rather than written out, so the day the canonical
 * origin changes, this follows - the same reason the origin is written once
 * anywhere. Only the `www.` twin of the canonical host redirects: localhost
 * and the `*.up.railway.app` service domain stay reachable as themselves,
 * because a health check that gets a 301 to another host is not checking this
 * deployment.
 *
 * 301 and not 308: everything this server answers is GET, so method
 * preservation buys nothing, and permanent-redirect is the signal search
 * engines have honoured longest.
 */

const CANONICAL = new URL(SITE.url);

/** The redirect a request must take, or nothing when it is already home. */
export function canonicalRedirect(request: Request): Response | undefined {
	const url = new URL(request.url);

	if (url.host !== `www.${CANONICAL.host}`) return undefined;

	url.protocol = CANONICAL.protocol;
	url.host = CANONICAL.host;

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
