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
		 * No cross-origin isolation here, and that is the fix rather than an
		 * omission.
		 *
		 * The pair was set for every dev response so the StackBlitz tab could
		 * boot a WebContainer, which needs SharedArrayBuffer, which a document
		 * only gets with COOP and COEP both set. The cost was invisible until
		 * somebody opened a video: under COEP a cross-origin iframe must itself
		 * assert COEP or the browser refuses it, `credentialless` relaxes that
		 * for subresources and not for frames, and YouTube asserts nothing. The
		 * frame says "refused to connect" with no CSP violation and no useful
		 * console error.
		 *
		 * Vite's dev server takes one `headers` object for every response and
		 * has no per-route form, so the honest choice is which failure to have
		 * in dev: no WebContainer, or no embeds anywhere. Embeds appear on
		 * pages people read and the StackBlitz tab is one control on one tab,
		 * so embeds win.
		 *
		 * Production is per-route and needs no such trade - `nitro.config.ts`
		 * scopes the pair to `/components/**`, where both work.
		 */
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
			// `@sushindustries/db`'s client.server.ts out of the browser bundle.
			// The default client pattern is `**/*.server.*`, which needs a segment
			// before `.server.` - so a file named plainly `server.ts` matches
			// nothing and is not protected at all. Measured rather than assumed on
			// 2026-08-19: a bare `server.ts` reading `process.env.DATABASE_URL`,
			// imported from a route component, built clean with zero diagnostics,
			// while the same module named `probe.server.ts` failed the build.
			//
			// `files` replaces the defaults rather than appending to them, so the
			// original pattern is restated here. Dropping it would trade one blind
			// spot for a much larger one.
			importProtection: {
				client: {
					files: ["**/*.server.*", "**/server.ts", "**/server/**"],
				},
			},
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
			//
			// `/studio` is excluded for a different reason than `/packages`, and a
			// worse one if it is forgotten. It is behind a sign-in, and a
			// prerendered page is a static file Nitro serves *before* the route
			// runs - so the build produced an HTML file of the signed-out shell and
			// served it to everyone, gate and all, with no error anywhere. The page
			// looked empty rather than forbidden, which is the failure that takes
			// longest to recognise.
			//
			// Anything private must be in this list. A page whose content depends
			// on who is asking cannot have one answer baked at build time.
			prerender: {
				enabled: true,
				crawlLinks: true,
				filter: (page) =>
					!page.path.startsWith("/packages") &&
					!page.path.startsWith("/studio") &&
					// An invitation page is per-link and single-use. Baking one at
					// build time would serve every visitor the same answer about a
					// credential that only exists for one of them.
					!page.path.startsWith("/access"),
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
