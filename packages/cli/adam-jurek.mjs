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

const argv = process.argv.slice(2);

/*
 * Flags are stripped before the command is taken, which is why the help flags
 * have to be looked for in the raw argv rather than in `command`. `--help`
 * filtered itself out, left `command` undefined, and took the "invoked with
 * nothing" branch - printing the usage and exiting 1, so it looked like it had
 * worked and failed every `set -e` script that ran it.
 */
const askedForHelp = argv.some((one) => one === "--help" || one === "-h");

const [command, ...rest] = argv.filter((a) => !a.startsWith("--"));

const COMMANDS = {
	async stack() {
		const { stack } = await import("./commands/stack.mjs");
		await stack();
	},
	async refs() {
		const { refs } = await import("./commands/refs.mjs");
		await refs();
	},
	async connectors() {
		const { connectors } = await import("./commands/connectors.mjs");
		await connectors();
	},
	async setup() {
		const { setup } = await import("./commands/setup.mjs");
		await setup();
	},
	async studio() {
		const { studio } = await import("./commands/studio.mjs");
		await studio();
	},
	async graph() {
		const { graph } = await import("./commands/graph.mjs");
		await graph();
	},
	async graphql() {
		const { graphql } = await import("./commands/graphql.mjs");
		await graphql();
	},
	async sync() {
		const { sync } = await import("./commands/sync.mjs");
		await sync();
	},
	async map() {
		const { map } = await import("./commands/map.mjs");
		return map();
	},
	async pipeline() {
		const { pipeline } = await import("./commands/pipeline.mjs");
		return pipeline();
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

/*
 * `--help` and `-h` as well as `help`, because those are what people type and
 * what a shell completion offers. They used to fall through to the unknown
 * command branch, which printed the usage and then exited 1 - so `adam-jurek
 * --help` looked like it worked and failed every `set -e` script and CI step
 * that ran it.
 *
 * Asking for help succeeds. Invoking with nothing at all does not: there is no
 * default action, and exiting 0 having done nothing is how a broken pipeline
 * stays green.
 */
if (askedForHelp || !command || command === "help") {
	await usage();

	// Asking for help succeeds. Invoking with nothing at all does not: there is
	// no default action, and exiting 0 having done nothing is how a broken
	// pipeline stays green.
	process.exit(askedForHelp || command ? 0 : 1);
}

const run = COMMANDS[command];
if (!run) {
	fail(`Unknown command "${command}".`);
	// Awaited: `usage` reads the tool groups from their own module, so exiting
	// without waiting printed the error and none of the help under it.
	await usage();
	process.exit(1);
}

try {
	await run();
} catch (error) {
	fail(error.message);
	process.exit(1);
}

/*
 * The groups are read from the module that defines them, not typed here.
 *
 * This line said "docs, stack, authoring" and had said it since before
 * `collections` was added - so the group the MCP server itself calls "the one
 * to reach for first" was the one the help did not mention. A list of names
 * beside the thing that owns the names is a list that goes stale silently,
 * which is the whole argument for importing it.
 *
 * The import is dynamic so it only costs anything when help is actually asked
 * for, and it is `await`ed by the one caller.
 */
async function usage() {
	const { GROUPS } = await import("./mcp/index.mjs");
	const groups = Object.keys(GROUPS).join(", ");

	console.log(`
adam-jurek - the command line for adamjurek.com

  pnpm sushindustries setup            what this machine is missing, and why

  pnpm sushindustries stack            what this repo depends on, and why
  pnpm sushindustries stack --sync     rewrite the versions from the workspace
  pnpm sushindustries refs             shard every provider's llms.txt locally
  pnpm sushindustries refs --force     re-fetch shards that already exist

  pnpm sushindustries connectors       compose and test every provider package
  pnpm sushindustries graphql          write the GraphQL schema from the tables
  pnpm sushindustries map              how this repository is put together
  pnpm sushindustries map --mermaid    the same graph, as a chart
  pnpm sushindustries studio           browse the deployed database
  pnpm sushindustries sync             write the index into Postgres
  pnpm sushindustries pipeline         run whichever of those are stale, in order
  pnpm sushindustries pipeline --dry   say what is stale and run nothing
  pnpm sushindustries mcp              serve every tool on stdio
  pnpm sushindustries mcp <group>      serve one group: ${groups}
  pnpm sushindustries mcp install      how to register it, four ways

Everything reads this repository. stack and refs maintain the data, sync and
graphql project it into Postgres, and mcp hands the lot to an agent.
`);
}
