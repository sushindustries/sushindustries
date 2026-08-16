import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/*
 * A fresh instance per call. Start calls this once per request on the server,
 * and returning a shared singleton would leak one visitor's loader data into
 * the next request's render.
 */
export function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
	});
}
