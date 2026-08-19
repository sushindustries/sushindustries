import { REGISTRY_ITEMS } from "@sushindustries/ui/registry";
import { beforeAll, describe, expect, inject, test } from "vitest";
import { SITE } from "../src/modules/content/site.catalogue";

/*
 * The entity graph, and the guardrails it ships with.
 *
 * A graph fails silently. Rename an element and the `requires` edge that named
 * it points nowhere; nothing throws, nothing 500s, and a crawler walking the
 * net simply finds a hole where a component used to be. So the endpoint
 * computes its own dangling ids and unpublished types and puts them in the
 * document, and this asserts they are empty - which makes the claim checkable
 * by anyone, not just by whoever wrote it.
 */

interface Graph {
	nodes: Array<{
		id: string;
		type: string;
		name: string;
		edges: Array<{ rel: string; to: string }>;
	}>;
	dangling: string[];
	unknownTypes: string[];
}

let base = "";
let graph: Graph;

beforeAll(async () => {
	base = inject("baseUrl");
	const response = await fetch(`${base}/r/graph.json`);
	expect(response.status).toBe(200);
	graph = (await response.json()) as Graph;
});

describe("the site graph", () => {
	test("has no edge pointing at a node nobody defines", () => {
		expect(graph.dangling).toStrictEqual([]);
	});

	test("publishes no type schema.org does not have", () => {
		expect(graph.unknownTypes).toStrictEqual([]);
	});

	test("covers every element in the registry", () => {
		const ids = new Set(graph.nodes.map((node) => node.id));

		const missing = REGISTRY_ITEMS.filter(
			(item) => !ids.has(`${SITE.url}/components/${item.name}#entity`),
		).map((item) => item.name);

		expect(missing).toStrictEqual([]);
	});

	test("carries each element's declared schema.org class", () => {
		const byId = new Map(graph.nodes.map((node) => [node.id, node]));

		const wrong = REGISTRY_ITEMS.filter((item) => {
			const node = byId.get(`${SITE.url}/components/${item.name}#entity`);
			return node?.type !== item.schema;
		}).map((item) => `${item.name}: expected ${item.schema}`);

		expect(wrong).toStrictEqual([]);
	});

	test("keeps the install edges the registry declares", () => {
		/*
		 * `scroll-spin` requires `use-scroll-turn`, and that fact lives in one
		 * place. If the graph ever states it differently from the installers,
		 * one of them is lying to somebody who is about to run a command.
		 *
		 * This edge and not `archive` -> `card`: that one turned out to be a
		 * declaration of nothing - archive never imported Card - and a test
		 * pinned to a spurious edge is the test defending the mistake.
		 */
		const spin = graph.nodes.find((node) =>
			node.id.endsWith("/components/scroll-spin#entity"),
		);

		expect(spin).toBeDefined();
		expect(spin?.edges.map((edge) => edge.to)).toContain(
			`${SITE.url}/components/use-scroll-turn#entity`,
		);
	});
});

describe("querying it", () => {
	test("returns one node with both directions of its edges", async () => {
		const id = `${SITE.url}/components/card#entity`;
		const response = await fetch(
			`${base}/r/graph.json?node=${encodeURIComponent(id)}`,
		);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			node: { id: string };
			in: Array<{ id: string }>;
			out: Array<{ id: string }>;
		};

		expect(body.node.id).toBe(id);
		// "What installs this" is the question a component page is asked, and
		// it is only answerable from the incoming side.
		expect(body.in.length).toBeGreaterThan(0);
		expect(body.out.length).toBeGreaterThan(0);
	});

	test("refuses an id it does not have, and says so", async () => {
		const response = await fetch(`${base}/r/graph.json?node=nonsense`);
		expect(response.status).toBe(404);

		const body = (await response.json()) as { error: string; hint?: string };
		expect(body.error).toBe("no such node");
		expect(body.hint).toBeTruthy();
	});

	test("filters to one kind of edge", async () => {
		const response = await fetch(`${base}/r/graph.json?rel=requires`);
		expect(response.status).toBe(200);

		const body = (await response.json()) as Graph;
		const rels = new Set(
			body.nodes.flatMap((node) => node.edges.map((edge) => edge.rel)),
		);

		expect([...rels]).toStrictEqual(["requires"]);
	});
});
