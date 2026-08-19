import { SITE } from "../content/site.catalogue";

/*
 * Subdomains, as one table read in both directions.
 *
 * `studio.adamjurek.com/documents` and `adamjurek.com/studio/documents` are
 * the same page. The router's `rewrite` option is what makes that true rather
 * than approximately true: `input` folds the host into the path when a request
 * arrives, `output` unfolds it again when a `<Link>` is rendered, and because
 * both read this array there is no way for one of them to know about a
 * subdomain the other does not.
 *
 * That symmetry is the whole reason to use the router's own mechanism instead
 * of a Nitro rewrite. A proxy-level rewrite gets requests to the right route
 * and leaves every link on the page pointing at `/studio/...` on whatever host
 * the visitor happens to be on - so the address bar says `studio.` and every
 * link says the apex, which is the bug that makes people stop trusting the
 * subdomain.
 *
 * Why subdomains at all, rather than paths that already work: these are three
 * different jobs sharing one deployment. The dashboard is numbers, the studio
 * writes to the repository, the labs are things that may break. Separating
 * them by host means each gets its own origin - which is a real boundary for
 * cookies, for CSP, and for anything that ever needs to be behind a different
 * gate. Paths cannot offer that, however tidy they look.
 *
 * Client-safe. It is read by the router, which runs in both places.
 */

export interface Subdomain {
	/** The label before the apex. `studio` in `studio.adamjurek.com`. */
	readonly host: string;

	/** The path prefix it maps to. Always leading-slash, never trailing. */
	readonly prefix: string;

	/** One line, for the places that list them. */
	readonly about: string;
}

export const SUBDOMAINS: readonly Subdomain[] = [
	{
		host: "dashboard",
		prefix: "/dashboard",
		about: "What is in the database, and how it is moving.",
	},
	{
		host: "studio",
		prefix: "/studio",
		about: "The documents, and everything that can be changed about them.",
	},
	{
		host: "labs",
		prefix: "/labs",
		about: "Things being tried. Nothing here is a promise.",
	},
];

/**
 * The apex, derived from the site's own URL rather than typed here.
 *
 * A second copy of the domain would be a second thing to change when it moves,
 * and this one would fail quietly: the rewrite would simply stop matching and
 * every subdomain would serve the home page.
 */
const APEX = new URL(SITE.url).hostname.replace(/^www\./, "");

/**
 * Which subdomain a hostname is, or nothing.
 *
 * Matches `studio.adamjurek.com` and `studio.localhost`, and deliberately not
 * bare `studio` - a single-label host is a machine name on somebody's network,
 * and treating it as a subdomain would rewrite requests on an intranet.
 *
 * `studio.localhost` works in every current browser without a hosts file,
 * which is what makes this testable on a laptop rather than only in
 * production - the class of bug this replaces was found in production twice.
 */
export function subdomainFor(hostname: string): Subdomain | undefined {
	const label = hostname.split(".")[0];
	if (!label || label === hostname) return undefined;

	const rest = hostname.slice(label.length + 1).replace(/^www\./, "");
	if (rest !== APEX && rest !== "localhost") return undefined;

	return SUBDOMAINS.find((one) => one.host === label);
}

/**
 * Folds a subdomain into the path. Runs on every incoming request.
 *
 * `studio.adamjurek.com/documents` becomes `/studio/documents`, and
 * `studio.adamjurek.com/` becomes `/studio` - not `/studio/`, because a
 * trailing slash is a different route to the matcher and the index route is
 * the one without it.
 *
 * Requests to the apex are untouched, so `/studio/documents` keeps working
 * exactly as it does today. Both addresses resolve; neither is a redirect.
 */
export function rewriteInput(url: URL): URL {
	const found = subdomainFor(url.hostname);
	if (!found) return url;

	// Already prefixed - a rewrite applied twice would produce
	// `/studio/studio/documents`, which matches nothing.
	if (
		url.pathname === found.prefix ||
		url.pathname.startsWith(`${found.prefix}/`)
	) {
		return url;
	}

	url.pathname =
		url.pathname === "/" ? found.prefix : `${found.prefix}${url.pathname}`;

	return url;
}

/**
 * Unfolds the path back into a subdomain. Runs when a link is generated.
 *
 * Only when the page is already on that subdomain. A link from the apex to
 * `/studio` should stay on the apex - sending somebody across an origin
 * because they clicked a nav item is a page reload, a new cookie jar and a
 * surprise, and the two addresses are equally valid.
 */
export function rewriteOutput(url: URL): URL {
	const found = subdomainFor(url.hostname);
	if (!found) return url;

	if (url.pathname === found.prefix) {
		url.pathname = "/";
	} else if (url.pathname.startsWith(`${found.prefix}/`)) {
		url.pathname = url.pathname.slice(found.prefix.length);
	}

	return url;
}
