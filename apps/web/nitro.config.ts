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
export default defineNitroConfig({
	routeRules: {
		"/**": {
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
