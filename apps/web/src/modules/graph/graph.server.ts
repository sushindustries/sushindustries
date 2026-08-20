import { isSchemaType } from "@sushindustries/db/schema-org";
import { listPackages } from "../content/packages/packages.catalogue";
import { listPosts } from "../content/posts/posts.catalogue";
import { SITE } from "../content/site.catalogue";
import { listRegistry } from "../registry/registry.catalogue";
import { entityId, PERSON_ID, pageId, WEBSITE_ID } from "../seo/schema-graph";

/*
 * The whole site as one entity graph.
 *
 * The per-page JSON-LD says what a page is about. This says how everything on
 * the site is related, in one document: every element with the schema.org
 * class it declares, every package, every post, and the edges between them -
 * which element installs which, what belongs to what, who wrote all of it.
 *
 * It is derived, never stored. The registry already knows that `archive`
 * requires `card`; a second copy of that fact in a database would be a second
 * thing to keep true. So the graph is a projection of the catalogues, built
 * per request, and the `things` table exists for what catalogues cannot hold -
 * rows that outlive a deploy.
 *
 * `.server.ts` because it is only ever called from a route handler. Nothing
 * here is privileged; the suffix keeps request-shaped code out of components.
 */

export interface GraphEdge {
	/** The schema.org property this edge is, e.g. `isPartOf`, `requires`. */
	readonly rel: string;
	readonly to: string;
}

export interface GraphNode {
	/** The `@id` this node is published under. Edges point at these. */
	readonly id: string;
	/** Its schema.org class. Validated against the vocabulary before it ships. */
	readonly type: string;
	readonly name: string;
	readonly description?: string;
	readonly url?: string;
	readonly edges: readonly GraphEdge[];
}

export interface SiteGraph {
	readonly generated: string;
	readonly nodes: readonly GraphNode[];
	/** Ids referenced by an edge that no node defines. Always empty, by test. */
	readonly dangling: readonly string[];
	/** Node types that schema.org does not publish. Same. */
	readonly unknownTypes: readonly string[];
}

function elementNodes(origin: string): GraphNode[] {
	return listRegistry().map((item) => {
		const path = `/components/${item.name}`;

		return {
			id: entityId(path),
			type: item.schema,
			name: item.title,
			description: item.description,
			url: `${origin}${path}`,
			edges: [
				{ rel: "isPartOf", to: WEBSITE_ID },
				{ rel: "author", to: PERSON_ID },
				{ rel: "mainEntityOfPage", to: pageId(path) },
				/*
				 * The edges that make this a graph rather than a list: what an
				 * element drags in when you install it. They come from the same
				 * field the installers read, so a dependency cannot be true for
				 * npm and false here.
				 */
				...(item.registryDependencies ?? []).map((name) => ({
					rel: "requires",
					to: entityId(`/components/${name}`),
				})),
			],
		};
	});
}

function pageNodes(origin: string): GraphNode[] {
	/*
	 * Every element's page, as a node of its own. A `WebPage` and the thing it
	 * is about are different entities, and collapsing them is what makes a
	 * review of a component look like a review of a web page.
	 */
	return listRegistry().map((item) => {
		const path = `/components/${item.name}`;
		return {
			id: pageId(path),
			type: "WebPage",
			name: item.title,
			url: `${origin}${path}`,
			edges: [
				{ rel: "isPartOf", to: WEBSITE_ID },
				{ rel: "about", to: entityId(path) },
				{ rel: "author", to: PERSON_ID },
			],
		};
	});
}

function packageNodes(origin: string): GraphNode[] {
	return listPackages().map((entry) => {
		const path = `/packages/${entry.slug}`;
		return {
			id: entityId(path),
			type: "SoftwareApplication",
			name: entry.name,
			description: entry.description,
			url: `${origin}${path}`,
			edges: [
				{ rel: "isPartOf", to: WEBSITE_ID },
				{ rel: "author", to: PERSON_ID },
			],
		};
	});
}

function postNodes(origin: string): GraphNode[] {
	return listPosts().map((post) => {
		const path = `/posts/${post.slug}`;
		return {
			id: entityId(path),
			type: "BlogPosting",
			name: post.title,
			description: post.summary,
			url: `${origin}${path}`,
			edges: [
				{ rel: "isPartOf", to: WEBSITE_ID },
				{ rel: "author", to: PERSON_ID },
			],
		};
	});
}

/**
 * The graph, with its own guardrails run before it leaves.
 *
 * A graph is only useful if its edges resolve, and the failure is silent:
 * nothing throws when `requires` names an element that was renamed, the edge
 * simply points nowhere and a consumer walking it finds a hole. So the
 * dangling ids and any unpublished type are computed here and shipped in the
 * document, where a test asserts they are empty and a reader can see for
 * themselves rather than taking the claim on faith.
 */
export function siteGraph(origin: string): SiteGraph {
	const nodes: GraphNode[] = [
		{
			id: WEBSITE_ID,
			type: "WebSite",
			name: SITE.name,
			description: SITE.description,
			url: origin,
			edges: [
				{ rel: "publisher", to: PERSON_ID },
				{ rel: "author", to: PERSON_ID },
			],
		},
		{
			id: PERSON_ID,
			type: "Person",
			name: SITE.name,
			description: SITE.description,
			url: origin,
			edges: [],
		},
		...elementNodes(origin),
		...pageNodes(origin),
		...packageNodes(origin),
		...postNodes(origin),
	];

	const defined = new Set(nodes.map((node) => node.id));
	const dangling = [
		...new Set(
			nodes
				.flatMap((node) => node.edges.map((edge) => edge.to))
				.filter((id) => !defined.has(id)),
		),
	].sort();

	const unknownTypes = [
		...new Set(
			nodes.map((node) => node.type).filter((type) => !isSchemaType(type)),
		),
	].sort();

	return {
		generated: new Date().toISOString(),
		nodes,
		dangling,
		unknownTypes,
	};
}

/** One node and everything it touches, both directions. What a page shows. */
export function connectionsOf(
	graph: SiteGraph,
	id: string,
): {
	readonly node?: GraphNode;
	readonly out: readonly GraphNode[];
	readonly in: readonly GraphNode[];
} {
	const byId = new Map(graph.nodes.map((node) => [node.id, node]));
	const node = byId.get(id);

	const out = (node?.edges ?? [])
		.map((edge) => byId.get(edge.to))
		.filter((found): found is GraphNode => found !== undefined);

	/*
	 * Incoming edges are the half nobody stores and everybody wants: "what
	 * installs this" is the question a component page is actually asked, and it
	 * is only answerable by looking at every other node.
	 */
	const incoming = graph.nodes.filter((other) =>
		other.edges.some((edge) => edge.to === id),
	);

	return { node, out, in: incoming };
}
