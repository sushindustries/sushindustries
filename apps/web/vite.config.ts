import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/*
 * The whole site is one Start app. `tanstackStart()` owns the router plugin,
 * the SSR entry and the Nitro build, so there is no separate router-plugin
 * entry here - adding one is the usual way to silently turn off code
 * splitting, because the two resolve route paths differently.
 *
 * Vite 8 resolves tsconfig `paths` natively, so no vite-tsconfig-paths.
 */
export default defineConfig({
	server: {
		port: 3000,
		/*
		 * Cross-origin isolation, for the StackBlitz tab.
		 *
		 * WebContainers run on SharedArrayBuffer, and a page only gets that
		 * with COOP + COEP set - "embedded without proper isolation headers"
		 * is the error this pair removes. `credentialless` rather than
		 * `require-corp`, so third-party subresources keep loading without
		 * every one of them having to opt in via CORP.
		 *
		 * The production half of this lives in `nitro.config.ts`.
		 */
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "credentialless",
		},
	},

	resolve: {
		tsconfigPaths: true,
	},

	plugins: [
		/*
		 * Devtools must be first - it transforms other plugins' output to inject
		 * source locations, so anything registered ahead of it is invisible to it.
		 *
		 * It also strips the devtools imports from production builds, which is
		 * the half that matters: the panel is a devDependency and must never
		 * reach a visitor.
		 */
		devtools(),

		// Import protection is on by default and is what keeps
		// `@sushindustries/db`'s client.server.ts out of the browser bundle, so
		// there is nothing to configure here yet.
		tanstackStart(),

		/*
		 * Nitro turns the fetch handler into a real Node server at
		 * `.output/server/index.mjs`. Without it the build still succeeds - it
		 * just emits a handler with nothing to run it, which looks like a working
		 * build right up until the container starts.
		 */
		nitro(),

		viteReact(),
	],
});
