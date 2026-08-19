/*
 * One MCP server, and three groups of tools inside it.
 *
 * It was three servers first, and that was the wrong cut. The split bought a
 * separation nobody wanted - answering "how do I add a component" needs the
 * documentation and the templates in the same breath - and it cost three
 * near-identical entries in every file that registers them, which is three
 * places to edit and three chances to disagree.
 *
 * So the organisation moved to where it reads better anyway: the tool names.
 * `read-doc`, `find-reference` and `create-post` say what they do and which
 * group they belong to without a process boundary to enforce it, and the code
 * stays split across three files because that is where splitting helps.
 *
 * A group can still be served alone - `mcp stack` - for the case where a
 * project wants the dependency index and none of the rest. Nothing needs it
 * today, and it costs one line.
 */

import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { registerAuthoringTools } from "./authoring.mjs";
import { registerDocsTools } from "./docs.mjs";
import { registerStackTools } from "./stack.mjs";

export const GROUPS = {
	docs: {
		about: "component pages, package READMEs, posts and skills",
		register: registerDocsTools,
	},
	stack: {
		about: "our dependencies' documentation indexes, sharded locally",
		register: registerStackTools,
	},
	authoring: {
		about: "published paths, templates, and adding to the site",
		register: registerAuthoringTools,
	},
};

export const NAME = "sushindustries";

export async function serve(which) {
	if (which && !GROUPS[which]) {
		throw new Error(
			`Unknown tool group "${which}". Available: ${Object.keys(GROUPS).join(", ")}, or none for all of them.`,
		);
	}

	const server = new McpServer({
		name: which ? `${NAME}-${which}` : NAME,
		version: "0.1.0",
	});

	for (const [key, group] of Object.entries(GROUPS)) {
		if (!which || which === key) await group.register(server);
	}

	await server.connect(new StdioServerTransport());
}
