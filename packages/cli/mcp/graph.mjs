/*
 * The workspace as a graph, over MCP.
 *
 * `pnpm sushindustries map` already reads this out of the manifests. This
 * exposes the same two views as tools, because an agent that has to shell out
 * to a CLI is an agent that has been given a shell - and the whole point of
 * the judging agent is that it needs exactly one fact-shaped answer and no
 * permission to go looking.
 *
 * Two tools rather than one with a flag. `describe-workspace` is what a
 * verdict is computed from; `draw-workspace` is what a person looks at. They
 * are different readers wanting different things, and a `format` parameter
 * would mean every caller learning which value it wants.
 *
 * Nothing here re-derives the graph. Both call the same command module, so a
 * tool cannot disagree with the CLI about what this repository looks like.
 */

import { z } from "zod";
import { text } from "./core.mjs";

/**
 * The command module, imported lazily.
 *
 * It reads every manifest on the way in, and an MCP server that pays for that
 * at startup pays for it whether or not anybody asks about the graph.
 */
const load = () => import("../commands/map.mjs");

export function registerGraphTools(server) {
	server.registerTool(
		"describe-workspace",
		{
			title: "The workspace as facts",
			description:
				"Every package, what each depends on and is used by, any dependency cycles, any package depending on an app, the deepest chain, and which packages install with nothing else from the workspace. The whole input a judgement about structure needs, as JSON. Start here rather than reading manifests.",
			inputSchema: z.object({}),
		},
		async () => {
			const { workspaceFacts } = await load();
			return text(JSON.stringify(workspaceFacts(), null, "\t"));
		},
	);

	server.registerTool(
		"draw-workspace",
		{
			title: "The workspace as a chart",
			description:
				"The same graph as a Mermaid diagram: apps and packages as nodes, the dependencies they declare on each other as edges. For showing somebody, rather than for deciding something - `describe-workspace` is the one to compute from.",
			inputSchema: z.object({}),
		},
		async () => {
			const { workspaceChart } = await load();
			return text(workspaceChart());
		},
	);
}
