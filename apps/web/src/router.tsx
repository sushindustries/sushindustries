import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { RouteError, RouteNotFound } from "./modules/chrome/route-fallbacks";
import { routeTree } from "./routeTree.gen";

/*
 * A fresh instance per call. Start calls this once per request on the server,
 * and returning a shared singleton would leak one visitor's loader data into
 * the next request's render.
 *
 * The QueryClient is created here, beside the router, rather than inside a
 * provider component - because a loader runs before any component renders,
 * and a client that only exists in React context is a client no loader can
 * reach. Routes get it as `context.queryClient`, and
 * `setupRouterSsrQueryIntegration` does the rest: wraps the tree in the
 * provider, dehydrates whatever the server fetched into the stream, and
 * hydrates it on the client so nothing is fetched twice.
 *
 * The fallbacks are declared here so every route has them: a 404 or a render
 * error anywhere in the tree lands on a designed page rather than on the
 * router's generic paragraph - which the dev log had been warning about on
 * every bad URL.
 */
export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				/*
				 * Data rendered on the server is fresh by definition, so refetching
				 * it the moment the client hydrates is pure waste. A minute is long
				 * enough to cover a navigation and short enough that nothing looks
				 * stale.
				 */
				staleTime: 60_000,
				retry: 1,
			},
		},
	});

	const router = createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		/*
		 * The default preload stale time is kept, not zeroed. Zeroing it is the
		 * documented pairing for loaders that delegate all caching to Query -
		 * ours do not: they return synchronous catalogue reads the router itself
		 * caches perfectly well, and re-running them on every hover buys nothing.
		 */
		defaultNotFoundComponent: RouteNotFound,
		defaultErrorComponent: RouteError,
	});

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}
