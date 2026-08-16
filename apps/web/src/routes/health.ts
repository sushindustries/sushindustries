import { createFileRoute } from "@tanstack/react-router";

/*
 * Readiness probe. A server route rather than a server function because the
 * caller is Railway, not the app - it wants an HTTP status code and no
 * JavaScript, which is exactly the HTTP-semantics justification server routes
 * are reserved for.
 *
 * It deliberately checks nothing. A health check that also pings the database
 * turns a slow query into a restart loop, and this site renders every page
 * without a database anyway.
 */
export const Route = createFileRoute("/health")({
	server: {
		handlers: {
			GET: () =>
				new Response("ok", {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": "no-store",
					},
				}),
		},
	},
});
