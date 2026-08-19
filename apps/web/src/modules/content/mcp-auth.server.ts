/*
 * One bearer gate, for the two endpoints that need one.
 *
 * `/mcp` and `/graphql` are the same surface reached two ways - the same
 * projection of the same repository - so they are the same decision about who
 * may read it. Written twice they would eventually be two decisions, and the
 * one that drifts is always the one nobody looked at.
 *
 * `.server.ts` because it reads the environment.
 */

/** The variable both endpoints are gated on. Unset closes them. */
const VARIABLE = "MCP_AUTH_TOKEN";

/**
 * The authorization server that issues tokens for this resource, if any.
 *
 * Named rather than implemented. Being an OAuth 2.1 authorization server is a
 * real piece of software - authorize, token, PKCE, client registration, key
 * rotation - and standing up a half of one is worse than pointing at somebody
 * who has built the whole thing.
 *
 * Unset means this resource is not protected by OAuth, and every surface that
 * would advertise it says so plainly rather than advertising a dead end.
 */
export function authorizationServer(): string | null {
	return process.env.AUTH_ISSUER?.replace(/\/$/, "") || null;
}

/** This deployment's origin, from the request that reached it. */
function origin(request: Request): string {
	const url = new URL(request.url);
	const forwarded = request.headers.get("x-forwarded-proto");
	return `${forwarded ?? url.protocol.replace(":", "")}://${url.host}`;
}

/**
 * Null when the request may proceed, a response when it may not.
 *
 * Closed by default, and closed loudly. An unset token answers 503 rather than
 * serving anonymously: a private endpoint that quietly becomes public when a
 * variable fails to load is the failure worth designing against, and it is the
 * one nobody notices.
 *
 * The comparison runs to the end of the expected value rather than stopping at
 * the first wrong character. The difference is not observable across the
 * internet, but writing it this way costs nothing and means the question never
 * has to be asked.
 */
export function refuse(request: Request): Response | null {
	const expected = process.env[VARIABLE];

	if (!expected) {
		return new Response(
			`This endpoint is not configured. Set ${VARIABLE} to enable it.`,
			{ status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
		);
	}

	const offered =
		request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

	let same = offered.length === expected.length;
	for (let index = 0; index < expected.length; index++) {
		if (offered[index] !== expected[index]) same = false;
	}

	if (!same) {
		/*
		 * The challenge is what makes automatic sign-in possible.
		 *
		 * An MCP client reads `resource_metadata` out of this header, fetches
		 * the document it names, discovers the authorization server and runs
		 * OAuth in a browser - so the user signs in rather than pasting a token.
		 * `realm` alone, which this used to send, tells a client nothing it can
		 * act on.
		 *
		 * Only advertised when there is an authorization server to advertise.
		 * Pointing a client at discovery that ends in a 404 is a worse failure
		 * than a plain 401, because it fails later and less clearly.
		 */
		const issuer = authorizationServer();
		const challenge = issuer
			? `Bearer resource_metadata="${origin(request)}/.well-known/oauth-protected-resource", scope="docs:read"`
			: 'Bearer realm="sushindustries"';

		return new Response("Unauthorized", {
			status: 401,
			headers: {
				"www-authenticate": challenge,
				"content-type": "text/plain; charset=utf-8",
			},
		});
	}

	return null;
}
