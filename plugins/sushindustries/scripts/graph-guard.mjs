#!/usr/bin/env node

/*
 * The two structural mistakes, caught in the workspace the edit happened in.
 *
 * A cycle means two packages cannot be installed without each other, so a
 * change in one cascades back round to itself. An inversion - a package
 * depending on an app - means the package cannot be installed by anybody but
 * the repository it lives in. Both are wrong at any size, both are cheap to
 * find, and both are invisible in the diff that introduces them: you add one
 * line to a `dependencies` block and the shape of the whole workspace changes.
 *
 * So this runs after a manifest is written, and only then. It says nothing
 * when the graph is sound, which is almost always - a hook that speaks on every
 * edit is a hook people turn off.
 *
 * `ADAM_JUREK_ROOT` is what points the CLI at the project rather than at its
 * own installed copy. An installed plugin lives in a version-pinned cache with
 * no path back to the checkout, so without this it would faithfully describe
 * itself.
 */

import { execFileSync } from "node:child_process";

const project = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let facts;

try {
	facts = JSON.parse(
		execFileSync("npx", ["-y", "@sushindustries/cli", "map", "--json"], {
			cwd: project,
			env: { ...process.env, ADAM_JUREK_ROOT: project },
			encoding: "utf8",
			timeout: 30_000,
			stdio: ["ignore", "pipe", "ignore"],
		}),
	);
} catch {
	/*
	 * No workspace, no CLI, no network for the fetch - all the same answer. A
	 * guard that fails loudly when it cannot run is a guard that interrupts
	 * somebody who has done nothing wrong.
	 */
	process.exit(0);
}

const wrong = [
	...facts.cycles.map(
		(loop) =>
			`  cycle      ${loop.join(" -> ")}\n             neither can be installed without the other`,
	),
	...facts.inversions.map(
		(one) =>
			`  inversion  ${one.from} depends on ${one.to}, which is an app\n             an app is a sink - this package can no longer be installed by anybody else`,
	),
];

if (wrong.length === 0) process.exit(0);

console.error(
	[
		"The dependency graph gained something that is wrong at any size:",
		"",
		...wrong,
		"",
		"Break the weaker edge, or move what the two share into a third package.",
	].join("\n"),
);

// 2 is what feeds this back to be fixed now, rather than at the gate.
process.exit(2);
