import { createFileRoute } from "@tanstack/react-router";
import { openSession } from "../../../../modules/access/github-auth.server";
import { refuse } from "../../../../modules/access/mcp-auth.server";
import {
	getElement,
	getElements,
} from "../../../../modules/graph/elements.server";
import { json, originFrom } from "../../../../modules/registry/registry.server";

/*
 * The element graph, as data and as a diagram.
 *
 *   GET /api/v1/studio/graph              every element, with its edges
 *   GET /api/v1/studio/graph?name=nav-bar one element's orbit
 *   GET /api/v1/studio/graph?format=mermaid   the same, drawn
 *
 * Two formats from one endpoint rather than two endpoints, because they are
 * the same question asked by different readers: a program wants the edges, a
 * person wants the picture, and splitting them would mean two things to keep
 * in step about which elements exist.
 *
 * `mermaid` is the same syntax `pnpm sushindustries graph` writes into
 * `content/graphs/`, so a diagram copied from here and one committed to the
 * repository are the same diagram. That is the property worth having: the
 * files are for reading and reviewing, this is for a tool that wants one now
 * without a checkout.
 *
 * Behind the studio's gate, because it describes an unreleased library as much
 * as a released one - `partOf` in particular says which components nothing
 * uses yet, which is a roadmap read backwards.
 */

/** Mermaid ids cannot hold a hyphen. */
const id = (name: string) => name.replaceAll("-", "_");

/**
 * The same shapes the generated files use.
 *
 * A block is double-bracketed and a component is rounded, so the distinction
 * the diagram exists to show is carried by the shape rather than by a legend
 * somebody has to read first.
 */
const shapeOf = (kind: string, title: string) =>
	kind === "BLOCK" ? `[["${title}"]]` : `("${title}")`;

interface Node {
	readonly name: string;
	readonly title: string;
	readonly kind: string;
	readonly tokens: number;
}

function mermaid(
	nodes: readonly Node[],
	edges: readonly (readonly [string, string])[],
): string {
	return [
		"flowchart TD",
		...nodes.map((one) => `\t${id(one.name)}${shapeOf(one.kind, one.title)}`),
		"",
		...edges.map(([from, to]) => `\t${id(from)} --> ${id(to)}`),
	].join("\n");
}

export const Route = createFileRoute("/api/v1/studio/graph")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!openSession(request)) {
					const refused = await refuse(request, "studio:read");
					if (refused) return refused;
				}

				const params = new URL(request.url).searchParams;
				const name = params.get("name");
				const format = params.get("format") ?? "json";

				const nodes: Node[] = [];
				const edges: [string, string][] = [];

				if (name) {
					const element = await getElement(name);
					if (!element) {
						return json(
							{ error: `No element called "${name}".` },
							{ status: 404 },
						);
					}

					/*
					 * One level, plus the parts of the parts. Two, like the generated
					 * files - one level hides that a block's parts share things, and
					 * three is where a diagram stops being a map.
					 */
					const seen = new Map<string, Node>();
					const add = (one: Node) => seen.set(one.name, one);

					/*
					 * Resolved by name rather than read off the element.
					 *
					 * `parts` is a GraphQL field resolver - it exists for a query, not
					 * on the shaped object - and the shaped object carries
					 * `partNames`. That split is what stops the graph recursing when
					 * it is serialised; here it means two explicit lookups, which is
					 * the honest cost of a bound that works.
					 */
					add(element);
					for (const partName of element.partNames) {
						const part = await getElement(partName);
						if (!part) continue;

						add(part);
						edges.push([element.name, part.name]);

						for (const deeperName of part.partNames) {
							const deeper = await getElement(deeperName);
							if (!deeper) continue;

							add(deeper);
							edges.push([part.name, deeper.name]);
						}
					}
					nodes.push(...seen.values());
				} else {
					const all = await getElements({});
					for (const element of all) {
						nodes.push(element);
						for (const part of element.partNames) {
							edges.push([element.name, part]);
						}
					}
				}

				if (format === "mermaid") {
					/*
					 * `text/plain`, not `text/vnd.mermaid`. The registered type would
					 * be more correct and would make a browser download it instead of
					 * showing it, which for something whose whole purpose is being
					 * copied is the wrong trade.
					 */
					return new Response(`${mermaid(nodes, edges)}\n`, {
						headers: {
							"content-type": "text/plain; charset=utf-8",
							"cache-control": "no-store, private",
						},
					});
				}

				const origin = originFrom(request);

				return json({
					nodes: nodes.map((one) => ({
						...one,
						/*
						 * The document holding this element's committed diagram. Not
						 * built from the name blindly - only elements with parts get
						 * one, which is what `edges` already says.
						 */
						diagram: edges.some(([from]) => from === one.name)
							? `apps/web/content/graphs/${one.name}.md`
							: null,
					})),
					edges: edges.map(([from, to]) => ({ from, to })),
					totals: { nodes: nodes.length, edges: edges.length },
					formats: {
						mermaid: `${origin}/api/v1/studio/graph?format=mermaid${name ? `&name=${name}` : ""}`,
					},
					notes: [
						"Generated from packages/ui/registry.ts, which is the source. The committed diagrams under content/graphs are the same data written by `pnpm sushindustries graph`.",
						"An element with no incoming edge and no page is one that was built and forgotten.",
					],
				});
			},
		},
	},
});
