/*
 * Wiring the server into Claude Code.
 *
 * Prints commands rather than running them. Registering an MCP server edits a
 * file outside this repository, and a command that quietly rewrites your
 * editor's configuration is one you have to undo before you can trust it
 * again. Printed, it is copy-and-paste and you can read it first.
 *
 * There are three ways in and they are not interchangeable, which is the whole
 * reason this prints prose instead of one line.
 */

import { join } from "node:path";
import { root } from "../lib/context.mjs";
import { banner, blank, bold, dim, note } from "../lib/ui.mjs";
import { GROUPS, NAME } from "../mcp/index.mjs";

const ENTRY = join(root, "packages/cli/adam-jurek.mjs");

export function install() {
	banner("mcp install");

	console.log(`  ${bold("Working in this repository")}\n`);
	console.log("    Nothing to do.");
	blank();
	note(
		"`.mcp.json` at the root registers the server for anyone who opens this",
	);
	note("repo in Claude Code. Approve it once when prompted.");
	blank();

	console.log(`  ${bold("Somewhere else, from the marketplace")}\n`);
	console.log("    /plugin marketplace add sushindustries/sushindustries");
	console.log("    /plugin install sushindustries@sushindustries");
	blank();
	note("Adds the commands, the skill and the dependency index. The");
	note(
		"documentation and authoring tools need the repository, so they are not",
	);
	note("part of that install - they cannot read files that are not there.");
	blank();

	console.log(`  ${bold("By hand, pointed at this checkout")}\n`);
	console.log(`    claude mcp add ${NAME} -- node ${ENTRY} mcp`);
	blank();
	note("Add a group name to serve only part of it:");
	for (const [key, group] of Object.entries(GROUPS)) {
		console.log(`      mcp ${key.padEnd(10)} ${dim(group.about)}`);
	}
	blank();

	console.log(`  ${bold("Checking it worked")}\n`);
	console.log("    claude mcp list");
	blank();
	note(
		"Then ask for `list-providers`, or `list-docs`. A server that connected",
	);
	note("and answers nothing has usually not been sharded yet:");
	note("run `pnpm sushindustries refs` once.");
	blank();
}
