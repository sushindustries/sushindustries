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
		return new Response("Unauthorized", {
			status: 401,
			headers: {
				"www-authenticate": 'Bearer realm="sushindustries"',
				"content-type": "text/plain; charset=utf-8",
			},
		});
	}

	return null;
}
