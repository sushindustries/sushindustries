import { defineNitroConfig } from "nitro/config";

/*
 * Where the /ingest relay forwards. Absent, the relay is simply not mounted
 * and the client (which checks its own variable) stays dark - analytics is
 * decoration here, and a decoration must not be able to stop the server.
 */
const posthogHost = process.env.POSTHOG_HOST;

if (!posthogHost) {
	console.warn("POSTHOG_HOST unset - the /ingest relay is not mounted.");
}

/*
 * The production half of the cross-origin isolation pair; the dev half is
 * `server.headers` in `vite.config.ts`. The StackBlitz tab boots a
 * WebContainer, which needs SharedArrayBuffer, which a browser only grants to
 * a page served with COOP + COEP. `credentialless` keeps third-party
 * subresources loading without a CORP header on each.
 */
/**
 * What a page may be cached for, matching `POLICY` in
 * `packages/http/src/cache.ts`. `max-age=0` so a browser revalidates and a
 * deploy reaches repeat visitors at once; `s-maxage` so the edge holds it;
 * `stale-while-revalidate` so nobody waits for the refresh. Railway purges
 * HTML on every deploy, which makes the five minutes a ceiling, not a delay.
 */
const PAGES =
	"public, max-age=0, s-maxage=300, stale-while-revalidate=86400, stale-if-error=604800";

/** What a stable-named asset may be cached for. Never `immutable`. */
const ASSETS =
	"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export default defineNitroConfig({
	/*
	 * Both default to off, and both are free here.
	 *
	 * `minify` is the server bundle Railway actually runs. Nothing reads it,
	 * nothing debugs against it - a stack trace resolves through the source
	 * maps the build already emits - so shipping it unminified was paying to
	 * transfer and parse whitespace on every cold start.
	 *
	 * `compressPublicAssets` writes a `.gz` and a `.br` beside every public
	 * file over a kilobyte, once, at build time. A CDN compressing on the fly
	 * spends CPU per request to reach a worse ratio than brotli at maximum
	 * effort does once - and Railway's CDN serves a precompressed file when
	 * one is sitting there.
	 */
	minify: true,
	compressPublicAssets: { gzip: true, brotli: true },

	routeRules: {
		/*
		 * The edge policy, for everything Nitro answers without the app.
		 *
		 * `cacheControl` in `@sushindustries/http` sets this on responses that
		 * pass through the application, and for most of this site nothing ever
		 * did: a prerendered page and a file in `public/` are served by Nitro's
		 * static layer, which runs before any middleware. So the policy was
		 * written, documented and correct, and reached the home page, every
		 * post and every image never. Railway's edge answered `x-cache:
		 * DYNAMIC` on all of it, which is the honest reading of a response that
		 * carries no cache headers at all.
		 *
		 * Route rules are the only place a static response can be given
		 * headers, so this is where the two halves are able to agree. The
		 * values match `POLICY` in `packages/http/src/cache.ts` on purpose - if
		 * one changes, change both, and the reason each number is what it is
		 * lives there rather than being restated here.
		 */
		"/**": {
			headers: {
				"cache-control": PAGES,
			},
		},

		/*
		 * Images and the model, whose names are stable rather than hashed.
		 *
		 * Deliberately not `immutable`. That promises the bytes at this URL
		 * will never change, and `shots/card-laptop.webp` is recaptured under
		 * the same name every time the demo it photographs changes - so
		 * `immutable` here is how a component page shows a screenshot of
		 * something that no longer looks like that, for a year, with no fix but
		 * renaming the file. A day at the edge and a week of
		 * stale-while-revalidate buys the same saving and stays correctable.
		 *
		 * The hashed build output under `/assets/` needs none of this: Nitro
		 * already serves it `immutable`, which is safe precisely because its
		 * names change with its contents.
		 */
		"/shots/**": { headers: { "cache-control": ASSETS } },
		"/logos/**": { headers: { "cache-control": ASSETS } },
		"/models/**": { headers: { "cache-control": ASSETS } },
		"/sushi-logo.png": { headers: { "cache-control": ASSETS } },
		/*
		 * Cross-origin isolation, on the pages that need it and nowhere else.
		 *
		 * This was `/**` and it broke every video embed on the site. Under COEP
		 * a cross-origin iframe must itself assert COEP or the browser refuses
		 * to load it - `credentialless` relaxes that for *subresources*, not for
		 * frames - and YouTube asserts nothing. The result is a frame that says
		 * "refused to connect" with no CSP violation, no console error worth
		 * finding, and a `frame-src` that lists the origin it just blocked.
		 *
		 * Only the component pages need isolation: the StackBlitz tab boots a
		 * WebContainer, which needs SharedArrayBuffer, which a document only
		 * gets with COOP and COEP both set. Nothing else on the site does.
		 *
		 * The dev half of this is `server.headers` in `vite.config.ts`, which
		 * has the same narrowing to make.
		 */
		"/components/**": {
			headers: {
				"cross-origin-opener-policy": "same-origin",
				"cross-origin-embedder-policy": "credentialless",
			},
		},

		/*
		 * The heavy statics: the GLB and the logos. A year, immutable - these
		 * files change by being replaced, not by being edited, so a repeat
		 * visitor pays for the model exactly once. Combined with the pacer
		 * (nothing three-shaped loads before idle), the hero model costs LCP
		 * nothing on the first visit and bandwidth nothing on the rest.
		 *
		 * Railway's CDN sits in front and honours exactly these headers, so
		 * the first visit comes from an edge cache too - the headers are the
		 * contract, the CDN is the one reading it.
		 */
		"/models/**": {
			headers: { "cache-control": "public, max-age=31536000, immutable" },
		},
		"/logos/**": {
			headers: { "cache-control": "public, max-age=31536000, immutable" },
		},

		/*
		 * Analytics rides the site's own origin. The PostHog client is told
		 * `api_host: "/ingest"`, this rule relays it to their EU cloud, and
		 * two things fall out: the CSP's `connect-src 'self'` stays exactly
		 * that, and the blocklists that key on posthog.com hostnames never
		 * see one. Consent still gates every event - this is a route, not a
		 * decision to track anybody.
		 */
		...(posthogHost
			? {
					"/ingest/**": {
						proxy: `${posthogHost}/**`,
					},
				}
			: {}),
	},
});
