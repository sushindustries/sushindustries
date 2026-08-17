import { createRouter } from "@tanstack/react-router";
import { RouteError, RouteNotFound } from "./modules/chrome/route-fallbacks";
import { routeTree } from "./routeTree.gen";

/*
 * A fresh instance per call. Start calls this once per request on the server,
 * and returning a shared singleton would leak one visitor's loader data into
 * the next request's render.
 *
 * The fallbacks are declared here so every route has them: a 404 or a render
 * error anywhere in the tree lands on a designed page rather than on the
 * router's generic paragraph - which the dev log had been warning about on
 * every bad URL.
 */
export function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultNotFoundComponent: RouteNotFound,
		defaultErrorComponent: RouteError,
	});
}
