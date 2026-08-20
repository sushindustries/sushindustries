/*
 * The intent maps, regenerated from the workspace.
 *
 * `_artifacts/domain_map.yaml` and `_artifacts/skill_tree.yaml` tell
 * `@tanstack/intent` which package each skill covers and which packages are
 * deliberately out of scope. Both were written by hand, and both drifted: four
 * packages appeared in neither list, and both named a skill at a path nobody
 * had ever written. A doctor check now catches that, which is the second-best
 * answer - the best is that it cannot happen.
 *
 * So the derivable half is derived. Which packages exist and which ship a
 * skill is a directory listing; the sentence saying *why* a package is out of
 * scope is not, and never will be. This regenerates the first and carries the
 * second across, which is exactly the split `stack --sync` already makes
 * between a version and the reason a dependency is here.
 *
 * A new package with no reason yet stops the command rather than getting an
 * invented one. "Nobody has written why this is out of scope" is the honest
 * output, and inventing a sentence to fill a field is how a map starts lying.
 */

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { flags, root } from "../lib/context.mjs";
import { banner, blank, dim, fail, field, note, ok, warn } from "../lib/ui.mjs";

const MAPS = ["_artifacts/domain_map.yaml", "_artifacts/skill_tree.yaml"];

/** Every public package, with the skill it ships if it ships one. */
function packages() {
	return globSync("packages/*/package.json", { cwd: root })
		.sort()
		.flatMap((relative) => {
			const dir = relative.replace("/package.json", "");
			const manifest = JSON.parse(readFileSync(join(root, relative), "utf8"));
			if (!manifest.name || manifest.private) return [];

			const skills = globSync("skills/*/SKILL.md", { cwd: join(root, dir) });

			return [{ dir, name: manifest.name, skills }];
		});
}

/**
 * The reasons already written, by package name.
 *
 * Read out of whichever map is being rewritten rather than from a single
 * source, because the two files have drifted apart before and the honest thing
 * is to keep whatever each one already says rather than to pick a winner.
 */
function reasons(raw) {
	const found = new Map();
	let name = null;

	for (const line of raw.split("\n")) {
		const named = /^\s*-\s*name:\s*'?([^'\s]+)'?/.exec(line);
		if (named) {
			name = named[1];
			continue;
		}
		const reason = /^\s*reason:\s*(.+?)\s*$/.exec(line);
		if (reason && name) {
			found.set(name, reason[1]);
			name = null;
		}
	}

	return found;
}

/** Everything above `coverage:`, which is the hand-written half. */
const preamble = (raw) => raw.slice(0, raw.indexOf("coverage:"));

export function intent() {
	banner("intent");

	const all = packages();
	const write = flags.has("--sync");

	let stale = 0;
	let missing = 0;

	for (const path of MAPS) {
		const raw = readFileSync(join(root, path), "utf8");
		const known = reasons(raw);

		const uncovered = all.filter((one) => one.skills.length === 0);
		const unexplained = uncovered.filter((one) => !known.has(one.name));

		if (unexplained.length > 0) {
			missing += unexplained.length;
			for (const one of unexplained) {
				warn(`${path}: no reason written for ${one.name}`);
			}
			continue;
		}

		const rebuilt = [
			preamble(raw).trimEnd(),
			"",
			"coverage:",
			"  # Written by `pnpm sushindustries intent --sync`. Every public package",
			"  # with no skill appears here; the reason beside it is written by hand and",
			"  # carried across every regeneration, because why something is out of",
			"  # scope is not something a directory listing knows.",
			"  ignored_packages:",
			...uncovered.flatMap((one) => [
				`    - name: '${one.name}'`,
				`      reason: ${known.get(one.name)}`,
			]),
			"",
		].join("\n");

		if (rebuilt === raw) {
			console.log(`  ${dim("in step")}  ${path}`);
			continue;
		}

		stale += 1;

		if (write) {
			writeFileSync(join(root, path), rebuilt);
			console.log(`  ${dim("rewritten")}  ${path}`);
		} else {
			console.log(`  ${dim("stale")}  ${path}`);
		}
	}

	blank();
	field("packages", String(all.length));
	field("skills", String(all.filter((one) => one.skills.length > 0).length));
	blank();

	if (missing > 0) {
		fail(
			`${missing} package(s) have no reason written. Add one under coverage.ignored_packages, or give the package a skill.`,
		);
		process.exitCode = 1;
		return;
	}

	if (stale === 0) {
		ok("The maps describe the workspace.");
		return;
	}

	if (!write) {
		note("`--sync` rewrites them.");
		process.exitCode = 1;
		return;
	}

	ok("Rewritten from the workspace.");
}
