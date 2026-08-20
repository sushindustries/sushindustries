import { createMcpHandler } from "@modelcontextprotocol/server";
import { createFileRoute } from "@tanstack/react-router";
import { siteServer } from "../modules/content/mcp.server";
import { refuse } from "../modules/content/mcp-auth.server";
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

export const Route = createFileRoute("/mcp")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				return (await refuse(request, "docs:read")) ?? handler.fetch(request);
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
