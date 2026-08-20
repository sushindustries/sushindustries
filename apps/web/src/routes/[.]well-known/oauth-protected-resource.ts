import { createFileRoute } from "@tanstack/react-router";
import { authorizationServer } from "../../modules/access/mcp-auth.server";
import { originFrom } from "../../modules/registry/registry.server";

/*
 * OAuth 2.0 Protected Resource Metadata, RFC 9728.
 *
 * This is the document that turns `/mcp` from "paste a bearer token" into the
 * sign-in every other MCP server does: a client gets a 401, reads the
 * `resource_metadata` URL out of the `WWW-Authenticate` header, fetches this,
 * learns which authorization server issues tokens for us, and runs OAuth 2.1
 * with PKCE in a browser. The user sees a sign-in page and nothing else.
 *
 * The MCP specification requires a protected server to serve this. It does not
 * require the server to be its own authorization server, and this one is not:
 * `AUTH_ISSUER` names whoever is. Until that is set there is nothing truthful
 * to put in `authorization_servers`, and an empty list would send a client
 * through discovery to a dead end - so this answers 404 instead, which is the
 * honest way to say "this resource is not protected by OAuth".
 *
 * The bearer token keeps working either way. It is what a script uses, and a
 * script has no browser to sign in with.
 */
export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const issuer = authorizationServer();
				const origin = originFrom(request);

				if (!issuer) {
					return new Response(
						"No authorization server is configured for this resource. Set AUTH_ISSUER to enable OAuth sign-in; until then /mcp takes a bearer token.",
						{
							status: 404,
							headers: { "content-type": "text/plain; charset=utf-8" },
						},
					);
				}

				return new Response(
					`${JSON.stringify(
						{
							/*
							 * The canonical URI of the protected resource, which the
							 * client also sends back as the `resource` parameter so the
							 * token it gets is audience-bound to this server and useless
							 * anywhere else. No trailing slash: the spec asks for the
							 * form without one.
							 */
							resource: `${origin}/mcp`,
							authorization_servers: [issuer],
							bearer_methods_supported: ["header"],
							/*
							 * One scope, and it is the whole surface. Everything `/mcp`
							 * exposes is read-only - the tools that write live in the
							 * CLI, against a checkout - so a second scope would be a
							 * distinction without a difference and one more thing for a
							 * client to have to ask for.
							 */
							scopes_supported: ["docs:read"],
							resource_documentation: `${origin}/p/api`,
						},
						null,
						"\t",
					)}\n`,
					{
						headers: {
							"content-type": "application/json; charset=utf-8",
							// Discovery documents are fetched once per client per session
							// and change only when the deployment does.
							"cache-control": "public, max-age=3600",
						},
					},
				);
			},
		},
	},
});
