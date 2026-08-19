#!/usr/bin/env node

/*
 * The command line for this repository.
 *
 *   pnpm sushindustries <command>     from inside the repo
 *   adam-jurek <command>              once installed
 *
 * Two names for one program, and the split is deliberate: inside the repo you
 * type the organisation, because that is what the workspace is; installed
 * anywhere else you type the product, because that is what you installed.
 *
 * What it does divides in two. `stack` and `refs` maintain the data - the list
 * of what this repo depends on, and the sharded copy of each provider's
 * documentation index. `mcp` serves that data, plus this repo's own
 * documentation, to an agent over stdio.
 *
 * Everything reads from the repository. There is no second copy of anything
 * here, which is the property that keeps it from going stale.
 */

import { fail } from "./lib/ui.mjs";

const [command, ...rest] = process.argv
	.slice(2)
	.filter((a) => !a.startsWith("--"));

const COMMANDS = {
	async stack() {
		const { stack } = await import("./commands/stack.mjs");
		await stack();
	},
	async refs() {
		const { refs } = await import("./commands/refs.mjs");
		await refs();
	},
	async mcp() {
		const [which] = rest;
		if (which === "install") {
			const { install } = await import("./commands/install.mjs");
			return install();
		}
		const { serve } = await import("./mcp/index.mjs");
		await serve(which);
	},
};

if (!command || command === "help") {
	usage();
	process.exit(command ? 0 : 1);
}

const run = COMMANDS[command];
if (!run) {
	fail(`Unknown command "${command}".`);
	usage();
	process.exit(1);
}

try {
	await run();
} catch (error) {
	fail(error.message);
	process.exit(1);
}

function usage() {
	console.log(`
adam-jurek - the command line for adamjurek.com

  pnpm sushindustries stack            what this repo depends on, and why
  pnpm sushindustries stack --sync     rewrite the versions from the workspace
  pnpm sushindustries refs             shard every provider's llms.txt locally
  pnpm sushindustries refs --force     re-fetch shards that already exist

  pnpm sushindustries mcp <server>     run one MCP server on stdio
  pnpm sushindustries mcp install      wire all three into Claude Code

Servers: docs, stack, authoring. Run \`mcp install\` to see what each one is
for and what the command to add it looks like.
`);
}
