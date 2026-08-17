import { createMiddleware, createStart } from "@tanstack/react-start";
import { securityHeaders } from "./modules/security/csp";

/*
 * The site's server entry.
 *
 * One request middleware, and it exists because a security header set anywhere
 * else is a header some route forgets. Start runs this around every request the
 * server handles - documents, server functions and the crawler files alike - so
 * the policy is a property of the site rather than of the routes that
 * remembered to ask for it.
 *
 * The header goes on after `next()`, not before: the response does not exist
 * until the handler has produced one, and a middleware that tried to set it
 * first would be writing to headers that get replaced.
 */
const withSecurityHeaders = createMiddleware({ type: "request" }).server(
	async ({ next }) => {
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

		return result;
	},
);

export const startInstance = createStart(() => ({
	requestMiddleware: [withSecurityHeaders],
}));
