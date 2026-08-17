import { defineNitroConfig } from "nitro/config";

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
		 * A CDN in front (Cloudflare on the Railway domain) would move the
		 * first visit to an edge cache too; that is an infra change, not an
		 * app change, and these headers are what it would respect.
		 */
		"/models/**": {
			headers: { "cache-control": "public, max-age=31536000, immutable" },
		},
		"/logos/**": {
			headers: { "cache-control": "public, max-age=31536000, immutable" },
		},
	},
});
