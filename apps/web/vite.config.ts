import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const posthogHost = process.env.POSTHOG_HOST;

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
		/*
		 * The dev half of the analytics relay; production is the `/ingest`
		 * route rule in `nitro.config.ts`. Same path, same destination, so
		 * the client config never has to know which server it is behind.
		 */
		proxy: posthogHost
			? {
					"/ingest": {
						target: posthogHost,
						changeOrigin: true,
						rewrite: (path: string) => path.replace(/^\/ingest/, ""),
					},
				}
			: undefined,
		/*
		 * Transformed at server start instead of on the first request, so the
		 * first page open does not pay the cold-transform tax for the module
		 * graph everything shares.
		 */
		warmup: {
			clientFiles: ["./src/routes/__root.tsx", "./src/routes/index.tsx"],
		},
	},

	resolve: {
		tsconfigPaths: true,
	},

	/*
	 * Everything the pacer loads *late* is declared *early*.
	 *
	 * Vite pre-bundles only the dependencies it can see from the entry. The
	 * viewer stack is behind a paced dynamic import that fires at idle, so in
	 * dev Vite discovered three mid-session, re-optimised, and forced a full
	 * page reload right while the page was being used - the reload flakiness
	 * was this, not the code. Naming them here puts them in the first
	 * optimisation pass, so the idle import is served from cache like
	 * everything else.
	 */
	optimizeDeps: {
		include: [
			"three",
			"three-stdlib",
			"three-custom-shader-material",
			"@react-three/fiber",
			"@react-three/drei",
			"@stackblitz/sdk",
			"@tanstack/react-pacer",
			"lenis",
		],
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

		tanstackStart({
			// Import protection is on by default and is what keeps
			// `@sushindustries/db`'s client.server.ts out of the browser bundle, so
			// there is nothing to configure there.
			//
			// Prerendering, because almost everything this site renders is fixed
			// at build time and identical for every visitor - posts, built pages,
			// component and package docs, the home page - the same fact that
			// already keeps them off `createServerFn` (see `content/posts` etc.,
			// "Content, not RPC" in the conventions skill). Rendering that HTML
			// fresh on every request was paying Railway compute for an answer
			// that never changes between deploys.
			//
			// `/packages/*` is excluded: its loader calls `countPackageView`, a
			// real server function that writes to Postgres - running that during
			// the build would either fail without a build-time DATABASE_URL or,
			// worse, quietly increment every package's count once per deploy.
			// Everything else has no per-request server dependency, confirmed
			// by grepping every route's loader for a server-function call.
			prerender: {
				enabled: true,
				crawlLinks: true,
				filter: (page) => !page.path.startsWith("/packages"),
			},
		}),

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
