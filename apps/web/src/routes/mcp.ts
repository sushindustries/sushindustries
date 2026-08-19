import { createMcpHandler } from "@modelcontextprotocol/server";
import { createFileRoute } from "@tanstack/react-router";
import { siteServer } from "../modules/content/mcp.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * This site as a remote MCP server.
 *
 * A server route rather than a second service, because the thing an agent
 * wants to ask about is already deployed here and already holds the index in
 * memory. Standing up a separate Railway service would mean a second build, a
 * second domain and a second copy of the content to keep in step - for tools
 * whose entire job is to read what this process already has.
 *
 * Streamable HTTP on one POST endpoint, stateless. The 2026 revision of the
 * spec dropped the session handshake for remote servers precisely so they
 * could be ordinary HTTP services, and an ordinary HTTP service is what Nitro
 * is already running.
 *
 * Register it by pointing `claude mcp add --transport http` at this path with
 * a bearer token. A GET returns that command, filled in with the origin it was
 * actually reached on.
 */

/*
 * Built once, not per request. Registering four tools on every call would
 * rebuild the same schemas for the lifetime of the process, and the handler is
 * stateless either way.
 */
const handler = createMcpHandler(() => siteServer());

/**
 * Whether this request may use the server.
 *
 * Closed by default, and closed loudly. An unset token means the endpoint
 * answers 503 rather than serving anonymously: a private server that quietly
 * becomes public when a variable fails to load is the failure worth designing
 * against, and it is the one nobody notices.
 *
 * Compared at full length rather than with an early return on the first wrong
 * character. The difference is unobservable across the internet, but writing
 * the timing-safe version costs nothing and means the question never comes up.
 */
function refuse(request: Request): Response | null {
	const expected = process.env.MCP_AUTH_TOKEN;

	if (!expected) {
		return new Response(
			"This endpoint is not configured. Set MCP_AUTH_TOKEN to enable it.",
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

export const Route = createFileRoute("/mcp")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				return refuse(request) ?? (await handler.fetch(request));
			},

			/*
			 * A GET says what this is and how to connect, because the first thing
			 * anybody does with an MCP URL is open it in a browser. It answers
			 * before the token check on purpose: there is nothing private in
			 * "this is an MCP endpoint", and a 401 here teaches you nothing.
			 */
			GET: ({ request }) =>
				new Response(
					[
						"This is a Model Context Protocol server, over Streamable HTTP.",
						"",
						"It answers POST, and it needs a bearer token.",
						"",
						"  claude mcp add --transport http sushindustries \\",
						`    ${originFrom(request)}/mcp \\`,
						'    --header "Authorization: Bearer <token>"',
						"",
						"Tools: list-docs, read-doc, outline-doc, search-docs.",
						"Everything it serves is also public at /llms.txt and /llms-full.txt.",
						"",
					].join("\n"),
					{
						status: 200,
						headers: {
							"content-type": "text/plain; charset=utf-8",
							"cache-control": "public, max-age=3600",
						},
					},
				),
		},
	},
});
