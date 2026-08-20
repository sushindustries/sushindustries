import { createFileRoute } from "@tanstack/react-router";
import { createSchema, createYoga } from "graphql-yoga";
import { refuse } from "../modules/access/mcp-auth.server";
import { resolvers, typeDefs } from "../modules/graph/graphql.server";

/*
 * The graph, over HTTP.
 *
 * A server route because the caller is a client library or an agent, which
 * wants a URL and a body and knows nothing about this app's RPC. That is the
 * HTTP-semantics justification server routes are reserved for, and it is the
 * same reason `/mcp`, the sitemap and the crawler files are server routes too.
 *
 * Yoga rather than Apollo Server: it is built on the Web `Request` and
 * `Response` that a TanStack Start handler already receives, so there is no
 * Node adapter in between and nothing to translate. The Apollo half of this is
 * the schema and the operations in `apollo/`, which is where Apollo's tooling
 * and its MCP server both look.
 *
 * Behind the same bearer token as `/mcp`, and for the same reason: this reads
 * a projection of a repository, not anything a visitor came here for.
 */

const yoga = createYoga({
	schema: createSchema({ typeDefs: typeDefs(), resolvers }),

	// The route already owns this path; Yoga needs telling so its own links and
	// its landing page point at the URL people actually reach it on.
	graphqlEndpoint: "/graphql",

	/*
	 * No GraphiQL. It is a page, and this endpoint answers to programs - a
	 * browser UI here would be a second surface to hold behind the token and to
	 * keep from shipping a stale schema. `apollo/schema.graphql` is checked in;
	 * read that.
	 */
	graphiql: false,

	/*
	 * Masked errors, which is Yoga's default and worth keeping deliberately: an
	 * unexpected resolver error otherwise returns its message, and the messages
	 * a Postgres driver produces name columns and constraints.
	 */
	maskedErrors: true,

	fetchAPI: { Response },
});

export const Route = createFileRoute("/graphql")({
	server: {
		handlers: {
			POST: async ({ request }) =>
				(await refuse(request, "docs:read")) ?? yoga.fetch(request),

			/*
			 * A GET says what this is rather than serving the graph. Yoga will
			 * answer a query over GET, and a GraphQL endpoint that responds to a
			 * URL somebody pasted into a browser is a cache and a referrer header
			 * away from leaking whatever was in the query string.
			 */
			GET: () =>
				new Response(
					[
						"This is a GraphQL endpoint. It answers POST, with a bearer token.",
						"",
						"The schema is checked in at apollo/schema.graphql, and the",
						"operations this repo actually runs are in apollo/operations/.",
						"",
						"Types are generated from the Drizzle tables by",
						"`pnpm sushindustries graphql`, so a field and its column cannot",
						"disagree. Everything it returns is a projection, rebuilt by",
						"`pnpm sushindustries sync` - the files remain the source.",
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
