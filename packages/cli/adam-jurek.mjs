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
	async graphql() {
		const { graphql } = await import("./commands/graphql.mjs");
		await graphql();
	},
	async sync() {
		const { sync } = await import("./commands/sync.mjs");
		await sync();
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

  pnpm sushindustries setup            what this machine is missing, and why

  pnpm sushindustries stack            what this repo depends on, and why
  pnpm sushindustries stack --sync     rewrite the versions from the workspace
  pnpm sushindustries refs             shard every provider's llms.txt locally
  pnpm sushindustries refs --force     re-fetch shards that already exist

  pnpm sushindustries connectors       compose and test every provider package
  pnpm sushindustries graphql          write the GraphQL schema from the tables
  pnpm sushindustries studio           browse the deployed database
  pnpm sushindustries sync             write the index into Postgres
  pnpm sushindustries mcp              serve all seventeen tools on stdio
  pnpm sushindustries mcp <group>      serve one group: docs, stack, authoring
  pnpm sushindustries mcp install      how to register it, four ways

Everything reads this repository. stack and refs maintain the data, sync and
graphql project it into Postgres, and mcp hands the lot to an agent.
`);
}
