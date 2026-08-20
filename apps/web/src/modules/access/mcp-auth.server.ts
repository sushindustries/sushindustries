import type { Bearer } from "@sushindustries/access";
import {
	bearerFrom,
	sameSecret,
	verify,
} from "@sushindustries/access/tokens.server";
import type { Scope } from "./access.schemas";

/*
 * One bearer gate, for the three endpoints that need one.
 *
 * `/mcp`, `/graphql` and `/studio/report` are the same surface reached three
 * ways - the same projection of the same repository - so they are the same
 * decision about who may read it. Written three times they would eventually be
 * three decisions, and the one that drifts is always the one nobody looked at.
 *
 * There are two kinds of key, and the order they are tried in is the design:
 *
 *   1. `MCP_AUTH_TOKEN`, the environment variable. One shared secret, no
 *      holder, no expiry, no revocation short of rotating it and logging
 *      everybody out. It is checked first and needs no database, which is the
 *      whole reason it survives: the gate that can only be opened by a query
 *      cannot be opened when Postgres is the thing that is broken.
 *
 *   2. A minted token, from `api_tokens`. Belongs to an account, carries
 *      scopes, expires, and can be taken away one holder at a time. This is
 *      what anybody who is not me should be given.
 *
 * `.server.ts` because it reads the environment and, now, the database.
 */

/** The variable the shared key lives in. Unset is fine; minted tokens remain. */
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
 * Whether this deployment can authenticate anybody at all.
 *
 * Both doors closed is a configuration failure rather than a refusal, and it
 * answers 503 so it reads as one. Serving anonymously when a variable fails to
 * load is the failure worth designing against, and it is the one nobody
 * notices; answering 401 instead would be a lie, because there is no
 * credential that would have worked.
 */
const closed = () => !process.env[VARIABLE] && !process.env.DATABASE_URL;

/**
 * Null when the request may proceed, a response when it may not.
 *
 * `scope` is what the endpoint being guarded actually needs, so the same
 * function protects the docs tools and the report with different keys. It
 * defaults to nothing: an endpoint has to name what it is, because a default
 * scope is a permission granted by forgetting to think about it.
 *
 * The verified bearer is not returned. Every caller today only needs the
 * yes-or-no, and handing back an identity nobody uses is how a value starts
 * being logged. `authenticate` below already carries it, so the day a caller
 * genuinely needs to know who is asking, the answer is to export that - not to
 * keep a second entry point warm on the chance somebody wants one.
 */
export async function refuse(
	request: Request,
	scope: Scope,
): Promise<Response | null> {
	const outcome = await authenticate(request, scope);
	return outcome.ok ? null : outcome.response;
}

async function authenticate(
	request: Request,
	scope: Scope,
): Promise<
	{ ok: true; bearer: Bearer | null } | { ok: false; response: Response }
> {
	if (closed()) {
		return {
			ok: false,
			response: new Response(
				`This endpoint is not configured. Set ${VARIABLE}, or a DATABASE_URL to mint tokens against, to enable it.`,
				{
					status: 503,
					headers: { "content-type": "text/plain; charset=utf-8" },
				},
			),
		};
	}

	const offered = bearerFrom(request);

	if (offered) {
		/*
		 * The shared secret opens everything, deliberately.
		 *
		 * It predates scopes and it is mine, so narrowing it would break the
		 * scripts that already hold it in exchange for restricting the one
		 * credential whose holder is not in question. A `null` bearer is how the
		 * rest of the system tells the two apart.
		 */
		const shared = process.env[VARIABLE];
		if (shared && sameSecret(offered, shared)) {
			return { ok: true, bearer: null };
		}

		if (process.env.DATABASE_URL) {
			/*
			 * A database that will not answer must not become an open door, and
			 * must not become a 500 either: this is a refusal, and an outage in
			 * the token table is a reason to refuse rather than to crash.
			 */
			const bearer = await verify(offered, scope).catch(() => null);
			if (bearer) return { ok: true, bearer };
		}
	}

	return { ok: false, response: unauthorized(request, scope) };
}

/**
 * The 401, and the challenge that makes automatic sign-in possible.
 *
 * An MCP client reads `resource_metadata` out of this header, fetches the
 * document it names, discovers the authorization server and runs OAuth in a
 * browser - so the user signs in rather than pasting a token. `realm` alone,
 * which this used to send, tells a client nothing it can act on.
 *
 * Only advertised when there is an authorization server to advertise. Pointing
 * a client at discovery that ends in a 404 is a worse failure than a plain
 * 401, because it fails later and less clearly.
 */
function unauthorized(request: Request, scope: Scope): Response {
	const issuer = authorizationServer();
	const challenge = issuer
		? `Bearer resource_metadata="${origin(request)}/.well-known/oauth-protected-resource", scope="${scope}"`
		: 'Bearer realm="sushindustries"';

	return new Response("Unauthorized", {
		status: 401,
		headers: {
			"www-authenticate": challenge,
			"content-type": "text/plain; charset=utf-8",
		},
	});
}
