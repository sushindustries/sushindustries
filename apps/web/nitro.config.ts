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
	},
});
