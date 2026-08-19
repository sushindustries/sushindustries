import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { connectionsOf, siteGraph } from "../../modules/content/graph.server";
import { json, originFrom } from "../../modules/registry/registry.server";

/*
 * The site's entity graph, queryable.
 *
 *   /r/graph.json                       every node and every edge
 *   /r/graph.json?node=<id>             one node, and everything it touches
 *   /r/graph.json?rel=requires          only edges of one kind
 *
 * A server route rather than a server function, for the reason the registry
 * index is one: the callers are other people's programs - a crawler, an agent,
 * the vault - and they want a URL and a JSON body, not our RPC protocol.
 *
 * On GraphQL, since it is the obvious question to ask of something called a
 * graph: it would be a server, a schema language and a client to answer three
 * query parameters over two hundred nodes derived from files in this repo. The
 * selection GraphQL exists to give you is worth its weight when many consumers
 * each want a different slice of a large, expensive backend. Here the whole
 * document is 40 kB, the only expensive thing would be the server, and this
 * route is already typed end to end. If a second consumer ever needs field
 * selection across entities this cannot express, that is the day it earns a
 * schema - not before.
 */

const query = z.object({
	/** An `@id`. Returns that node plus its neighbours in both directions. */
	node: z.string().optional(),
	/** Keep only edges with this schema.org property. */
	rel: z.string().optional(),
});

export const Route = createFileRoute("/r/graph.json")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const url = new URL(request.url);
				const parsed = query.safeParse(
					Object.fromEntries(url.searchParams.entries()),
				);

				/*
				 * A guardrail rather than a crash. A malformed query is the
				 * caller's mistake and the useful answer names it, where a 500
				 * teaches them nothing and looks like the site is broken.
				 */
				if (!parsed.success) {
					return json(
						{ error: "bad query", detail: parsed.error.issues },
						{ status: 400 },
					);
				}

				const graph = siteGraph(originFrom(request));
				const { node, rel } = parsed.data;

				if (node) {
					const found = connectionsOf(graph, node);
					if (!found.node) {
						return json(
							{
								error: "no such node",
								id: node,
								/* Say what would have worked. An id nobody can guess
								   is an API nobody can use. */
								hint: `try one of ${graph.nodes
									.slice(0, 3)
									.map((entry) => entry.id)
									.join(", ")}`,
							},
							{ status: 404 },
						);
					}

					return json({
						generated: graph.generated,
						node: found.node,
						out: found.out,
						in: found.in,
					});
				}

				if (rel) {
					return json({
						...graph,
						nodes: graph.nodes
							.map((entry) => ({
								...entry,
								edges: entry.edges.filter((edge) => edge.rel === rel),
							}))
							.filter((entry) => entry.edges.length > 0),
					});
				}

				return json(graph);
			},
		},
	},
});
