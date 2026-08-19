import {
	cacheControl,
	canonicalRedirect,
	markdownRedirect,
	securityHeaders,
} from "@sushindustries/http";
import {
	createCsrfMiddleware,
	createMiddleware,
	createStart,
} from "@tanstack/react-start";
import { SITE } from "./modules/content/site.catalogue";

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
		/*
		 * Before any work: a request to the www twin of the canonical origin
		 * gets its 301 and nothing else. Rendering a page in order to redirect
		 * away from it would be work the response throws away.
		 */
		const redirect = canonicalRedirect(request, SITE.url);
		if (redirect) return redirect;

		/*
		 * `Accept: text/markdown` on any page, sent to the Markdown mirror at
		 * the page's own path plus `index.md` - see `markdown-negotiation.ts`.
		 * Machine endpoints are excluded there; anything else with an
		 * unsatisfiable `Accept` still falls through to the 406 correction
		 * below `next()`.
		 */
		const markdown = markdownRedirect(request);
		if (markdown) return markdown;

		let result = await next();

		/*
		 * TanStack Start's own document handler answers any request whose
		 * `Accept` excludes the wildcard and `text/html` with a bare 500 - verified
		 * against `createStartHandler.js`, not assumed: a request with
		 * `Accept: text/markdown` or `Accept: application/json` for a normal
		 * page comes back `{"error":"Only HTML requests are supported here"}`
		 * at status 500, live, right now. That is a client capability this
		 * server does not offer, which is a 406, not a server fault - and a
		 * 500 on an ordinary request is what an uptime check, a crawler with
		 * an unusual header, or a future agent doing content negotiation all
		 * read as "this site is broken".
		 *
		 * Only server routes are exempt - `/api/v1`, `/.well-known/*` and the
		 * rest already answer any `Accept` header with 200, confirmed the
		 * same way, so this narrows to the one response shape the framework
		 * itself produces rather than guessing at which paths are documents.
		 */
		if (result.response.status === 500) {
			const probe = result.response.clone();
			const body = await probe.text().catch(() => "");

			if (body.includes("Only HTML requests are supported here")) {
				result = {
					...result,
					response: new Response(body, {
						status: 406,
						headers: result.response.headers,
					}),
				};
			}
		}

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
		 * The cache policy rides the same middleware, for the same reason the
		 * security headers do: a policy set anywhere else is a policy some
		 * route forgets. `cacheControl` returns nothing for anything that
		 * should not be cached, including any response where a route already
		 * chose its own header.
		 */
		const cachePolicy = cacheControl(request, result.response);

		if (cachePolicy) {
			result.response.headers.set("cache-control", cachePolicy);
		}

		/*
		 * RFC 8288, on every document. An agent that lands on any page can
		 * find the API catalog and the machine-readable index without first
		 * knowing either URL exists - the same discovery step a browser gets
		 * for free from a rendered nav, offered in the one place that does
		 * not require rendering anything.
		 *
		 * Scoped to `text/html`: a JSON response already names its own
		 * related links inline (see `/api/v1`'s own `related` field), so a
		 * Link header on it would repeat what the body already says.
		 */
		if (result.response.headers.get("content-type")?.includes("text/html")) {
			const origin = new URL(request.url).origin;
			result.response.headers.append(
				"link",
				`<${origin}/.well-known/api-catalog>; rel="api-catalog"`,
			);
			result.response.headers.append(
				"link",
				`<${origin}/p/api>; rel="service-doc"`,
			);
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
