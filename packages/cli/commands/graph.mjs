/*
 * The element graph, written as Markdown with mermaid in it.
 *
 * A block is an assembly of components, and the same components appear in
 * several blocks - `icon` is in nine of them. That is a graph, and a graph is
 * the one thing a list of registry entries cannot show you: reading
 * `folder-shelf`'s entry tells you it needs four things, and tells you nothing
 * about the fact that three of them need `icon` too.
 *
 * One diagram per block rather than one for everything. Seventy three nodes in
 * a single flowchart is a hairball - it renders, it is unreadable, and the
 * thing it was drawn to show is the first casualty. Twelve small diagrams each
 * answer one question.
 *
 * Written to files rather than served, for three reasons that all matter:
 * they are in git, so a diagram changing is a diff somebody reviews; they are
 * documents, so the studio already views them and the projection already
 * indexes them; and mermaid in a fence is copyable into anything that renders
 * it, which is most things now.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "../lib/context.mjs";
import { banner, blank, field, note, ok } from "../lib/ui.mjs";

const OUT = join(root, "apps/web/content/graphs");

/**
 * How deep an orbit goes.
 *
 * Two. One level shows what a block needs and hides that its parts share
 * things; three is where the diagrams stop being readable, which is the same
 * reason there is one per block rather than one for the library.
 */
const DEPTH = 2;

/** Mermaid ids cannot hold a hyphen. */
const id = (name) => name.replaceAll("-", "_");

/**
 * A block gets double brackets, a component gets a rounded box.
 *
 * The shape carries the distinction the diagram exists to show, so a reader
 * can see that `context-menu` inside `folder-shelf` is itself an assembly
 * without following an edge to find out.
 */
const shapeOf = (item, name) =>
	item?.kind === "block" ? `[["${item.title}"]]` : `("${item?.title ?? name}")`;

/** Every edge under one element, to `DEPTH` levels, without revisiting. */
function edgesFrom(by, name, depth = 0, seen = new Set()) {
	const item = by.get(name);
	if (!item || depth >= DEPTH) return [];

	const found = [];
	for (const part of item.registryDependencies ?? []) {
		found.push([name, part]);
		if (seen.has(part)) continue;
		seen.add(part);
		found.push(...edgesFrom(by, part, depth + 1, seen));
	}
	return found;
}

function diagram(by, name) {
	const edges = edgesFrom(by, name);
	if (edges.length === 0) return null;

	const nodes = [...new Set(edges.flat())];

	return [
		"flowchart TD",
		...nodes.map((one) => `\t${id(one)}${shapeOf(by.get(one), one)}`),
		"",
		...edges.map(([from, to]) => `\t${id(from)} --> ${id(to)}`),
	].join("\n");
}

export async function graph() {
	banner("graph");

	const { readRegistry } = await import(
		new URL("../../../scripts/docs.mjs", import.meta.url)
	);

	const items = readRegistry();
	const by = new Map(items.map((one) => [one.name, one]));

	/* What composes what, so each page can say who includes it. */
	const partOf = new Map();
	for (const item of items) {
		for (const part of item.registryDependencies ?? []) {
			partOf.set(part, [...(partOf.get(part) ?? []), item.name]);
		}
	}

	mkdirSync(OUT, { recursive: true });

	/*
	 * Cleared first, so a block that stops being one loses its page. Generated
	 * output that only ever grows is generated output that ends up describing
	 * something that no longer exists.
	 */
	for (const file of readdirSync(OUT)) {
		if (file.endsWith(".md")) rmSync(join(OUT, file));
	}

	const written = [];

	for (const item of items) {
		const chart = diagram(by, item.name);
		if (!chart) continue;

		const parents = partOf.get(item.name) ?? [];
		const parts = item.registryDependencies ?? [];

		const body = `---
title: ${item.title}
summary: What ${item.title} is built from, and what is built from it.
kind: ${item.kind ?? "component"}
element: ${item.name}
version: ${item.version}
draft: false
---

${item.description}

Installing it installs ${parts.length} other element${parts.length === 1 ? "" : "s"}. The diagram is two levels deep, which is where it stops being a map and starts being a hairball - follow a node to see its own.

\`\`\`mermaid
${chart}
\`\`\`

## Its parts

${parts.map((one) => `- \`${one}\` - ${by.get(one)?.description ?? "not in the registry"}`).join("\n")}

## What includes it

${
	parents.length > 0
		? parents.map((one) => `- \`${one}\``).join("\n")
		: `Nothing. That is fine for a block, which is a region of a page rather than
a part of one - and worth a second look for a component, because a component
nothing composes and no page shows is a component that was built and
forgotten.`
}

## Reading it

A double-bracketed node is a block: an assembly that stands as a region of a
page. A rounded one is a component: one thing with one job. A component
appearing under several parents is the reason this is drawn at all - it is the
fact a list of registry entries cannot show you.

Generated by \`pnpm sushindustries graph\`. Edit the registry, not this file.
`;

		writeFileSync(join(OUT, `${item.name}.md`), body);
		written.push(item.name);
	}

	blank();
	field("diagrams", String(written.length));
	field("depth", `${DEPTH} levels`);
	field("written", "apps/web/content/graphs");
	blank();
	note("Each one is a document, so the studio views it and `sync` indexes it.");
	note("Mermaid in a fence, so it is copyable into anything that renders one.");
	blank();
	ok("Graphed");
	blank();
}
