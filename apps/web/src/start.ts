import {
	createCsrfMiddleware,
	createMiddleware,
	createStart,
} from "@tanstack/react-start";
import { edgeCacheControl } from "./modules/edge/cache";
import { securityHeaders } from "./modules/security/csp";

/*
 * The site's server entry.
 *
 * One request middleware, and it exists because a header set anywhere else is
 * a header some route forgets - the security policy and the edge cache policy
 * both. Start runs this around every request the
 * server handles - documents, server functions and the crawler files alike - so
 * the policy is a property of the site rather than of the routes that
 * remembered to ask for it.
 *
 * The header goes on after `next()`, not before: the response does not exist
 * until the handler has produced one, and a middleware that tried to set it
 * first would be writing to headers that get replaced.
 */
const withResponseHeaders = createMiddleware({ type: "request" }).server(
	async ({ next, request }) => {
		const result = await next();

		/*
		 * `import.meta.env.DEV` rather than a runtime check: Vite replaces it at
		 * build time, so the production bundle contains the production policy as
		 * a literal and has no branch that could ever take the dev path.
		 */
		const headers = securityHeaders({ dev: import.meta.env.DEV });

		for (const [name, value] of Object.entries(headers)) {
			result.response.headers.set(name, value);
		}

		/*
		 * The edge cache policy rides the same middleware, for the same
		 * reason the security headers do: a policy set anywhere else is a
		 * policy some route forgets. `edgeCacheControl` returns nothing for
		 * anything that should not be cached, including any response where a
		 * route already chose its own header.
		 */
		const cacheControl = edgeCacheControl(request, result.response);

		if (cacheControl) {
			result.response.headers.set("cache-control", cacheControl);
		}

		return result;
	},
);

/*
 * Cross-site request forgery, on the server functions only.
 *
 * A server function is a same-origin RPC endpoint that runs with whatever
 * ambient authority the browser attaches to the request. Without this, any
 * other site can make a visitor's browser call one - the response is not
 * readable cross-origin, but the *effect* has already happened, which is the
 * whole of the attack for anything that writes.
 *
 * `handlerType === "serverFn"` is the filter because the rest of what this
 * server answers is deliberately open: the registry endpoints, the graph, the
 * Markdown views and `llms.txt` exist to be fetched by other people's tools
 * from other people's origins. Blanket CSRF would break every one of them to
 * protect documents that have nothing to forge.
 */
const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
	/*
	 * Order matters. CSRF first, so a rejected request is rejected before any
	 * work happens; the header middleware still runs on the way back out, which
	 * is what keeps the policy on the refusal too.
	 */
	requestMiddleware: [csrfMiddleware, withResponseHeaders],
}));
