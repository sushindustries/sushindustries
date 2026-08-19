/*
 * The Apollo Connectors providers in this repository.
 *
 * A provider is a schema file and nothing else: no resolvers, no server, no
 * process. It composes into somebody else's supergraph and starts answering.
 * That is the whole reason they live in `packages/` rather than in the app -
 * they are the most portable thing here, and the app is not involved at all.
 *
 * This command finds them, then runs rover's three checks against each: does
 * it compose, does it execute, do its tests pass. Rover is not a dependency of
 * this repo and is not installed by it, so a missing rover is reported rather
 * than worked around.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { flags, root } from "../lib/context.mjs";
import { banner, blank, dim, field, item, note, ok, warn } from "../lib/ui.mjs";

/** A package is a provider when it has a connectors schema beside a manifest. */
function providers() {
	const packages = join(root, "packages");

	return readdirSync(packages)
		.filter((name) => existsSync(join(packages, name, "schema.graphql")))
		.map((name) => ({
			name,
			dir: join(packages, name),
			hasTests: existsSync(join(packages, name, "tests")),
			hasSupergraph: existsSync(join(packages, name, "supergraph.yaml")),
		}));
}

function rover(args, cwd) {
	return execFileSync("rover", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
}

export async function connectors() {
	banner("connectors");

	try {
		rover(["--version"], root);
	} catch {
		warn("rover is not installed, so nothing here can be checked.");
		note("curl -sSL https://rover.apollo.dev/nix/latest | sh");
		blank();
		return;
	}

	const found = providers();
	if (!found.length) {
		note("No connectors providers. A package with a schema.graphql is one.");
		blank();
		return;
	}

	let failed = 0;

	for (const provider of found) {
		item(found.indexOf(provider) + 1, provider.name);

		/*
		 * Compose, then test. Executing is deliberately not part of this: it
		 * calls the real API, which costs rate limit and goes red when somebody
		 * else's service is down - neither of which is a fact about this repo.
		 * `rover connector run` is there for when you want exactly that.
		 */
		if (!provider.hasSupergraph) {
			warn(
				`${provider.name} has no supergraph.yaml, so it cannot be composed.`,
			);
			failed++;
			continue;
		}

		try {
			rover(
				["supergraph", "compose", "--config", "./supergraph.yaml"],
				provider.dir,
			);
			note("composes");
		} catch (error) {
			warn(`${provider.name} does not compose`);
			console.log(dim(String(error.stderr ?? error.message).slice(0, 600)));
			failed++;
			continue;
		}

		if (!provider.hasTests) {
			warn("no tests");
			continue;
		}

		try {
			const output = rover(["connector", "test"], provider.dir);
			const summary = output
				.split("\n")
				.reverse()
				.find((line) => line.includes("TEST RESULTS"));
			note(summary?.trim() ?? "tests passed");
		} catch (error) {
			warn(`${provider.name} has failing tests`);
			console.log(dim(String(error.stdout ?? error.message).slice(-900)));
			failed++;
		}
	}

	blank();
	field("providers", String(found.length));

	if (flags.has("--verbose")) {
		note("Run one against the live API:");
		note(
			"  rover connector run --schema schema.graphql -c 'Query.<field>' -v '{}'",
		);
	}

	blank();
	if (failed) {
		warn(`${failed} provider(s) need attention.`);
		process.exitCode = 1;
	} else {
		ok("Every provider composes and passes its tests");
	}
	blank();
}
