/*
 * Helpers shared by the registry endpoints.
 *
 * `.server.ts` because these only ever run inside a server route handler.
 * Nothing here is privileged — the registry is public by design — but keeping
 * the suffix means the request-shaped code cannot drift into a component by
 * accident.
 */

/*
 * Absolute URLs have to be built from the request, not from a constant. The
 * same build serves localhost, the Railway subdomain and any custom domain
 * later attached to it, and a registry that hands out URLs for the wrong
 * origin is a registry that installs nothing.
 *
 * `x-forwarded-*` is read because Railway terminates TLS at its proxy, so the
 * request the server sees is plain http on an internal host.
 */
export function originFrom(request: Request): string {
	const url = new URL(request.url);

	const host = request.headers.get("x-forwarded-host") ?? url.host;
	const proto =
		request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

	return `${proto}://${host}`;
}

export function json(body: unknown): Response {
	return new Response(JSON.stringify(body, null, 2), {
		headers: {
			"content-type": "application/json; charset=utf-8",
			// Installers are the only readers and they fetch once. Public because
			// there is nothing per-visitor in any of it.
			"cache-control": "public, max-age=300",
			// The whole point is that other people's tools can fetch this.
			"access-control-allow-origin": "*",
		},
	});
}

export function notFoundJson(message: string): Response {
	return new Response(JSON.stringify({ error: message }, null, 2), {
		status: 404,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"access-control-allow-origin": "*",
		},
	});
}
