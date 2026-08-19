/*
 * What this repo depends on, and why.
 *
 * The `for:` line on each entry is the part that cannot be derived. A lockfile
 * already knows every version in the tree; what it has never known is which of
 * those choices was load-bearing and what it was chosen for. That sentence is
 * the whole reason this file is written by hand.
 *
 * `--sync` fixes the half that can be derived. Versions drift the moment a
 * dependency is upgraded, and a stack file claiming a version nobody is
 * running is worse than no stack file, because it looks current.
 */

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { flags, parseStack, root, STACK } from "../lib/context.mjs";
import { banner, blank, bold, dim, field, note, ok, warn } from "../lib/ui.mjs";

/** Every version this workspace actually declares, by package name. */
function installedVersions() {
	const found = new Map();
	const manifests = [
		"package.json",
		...globSync("packages/*/package.json", { cwd: root }),
		...globSync("apps/*/package.json", { cwd: root }),
	];

	for (const relative of manifests) {
		const manifest = JSON.parse(readFileSync(join(root, relative), "utf8"));
		for (const section of ["dependencies", "devDependencies"]) {
			for (const [name, range] of Object.entries(manifest[section] ?? {})) {
				// The bare version, because a stack table showing "^1.2.3" is
				// reporting a policy where the reader asked for a fact.
				found.set(name, range.replace(/^[\^~>=<\s]+/, ""));
			}
		}
	}
	return found;
}

export async function stack() {
	const source = readFileSync(STACK, "utf8");
	const items = parseStack(source);

	if (flags.has("--sync")) return sync(source, items);

	banner("stack");

	const purposes = [...new Set(items.map((item) => item.purpose))];
	for (const purpose of purposes) {
		console.log(`  ${bold(purpose)}`);
		for (const item of items.filter((one) => one.purpose === purpose)) {
			const version = item.version ? dim(` ${item.version}`) : "";
			console.log(`    ${item.name}${version}`);
			console.log(`      ${dim(item.for)}`);
		}
		blank();
	}

	const indexed = items.filter((item) => item.llms);
	field("entries", String(items.length));
	field("indexed", `${indexed.length} publish an llms.txt`);
	field("source", "packages/cli/stack.yaml");
	blank();
	note("pnpm sushindustries refs   shard those indexes locally");
	blank();
}

/**
 * Rewrites every `version:` line from what the workspace declares.
 *
 * Line by line rather than by re-serialising the parsed list, because the
 * comments at the top of that file are the most useful thing in it and a
 * round trip through a data structure would drop every one of them.
 */
function sync(source, items) {
	banner("stack --sync");

	const installed = installedVersions();
	const changed = [];
	const missing = [];

	let current = null;
	const lines = source.split("\n").map((line) => {
		const started = line.match(/^-\s+name:\s*(.*)$/);
		if (started) {
			current = items.find((item) => item.name === started[1].trim());
			return line;
		}

		const version = line.match(/^(\s+version:\s*)(.*)$/);
		if (!version || !current?.package) return line;

		const actual = installed.get(current.package);
		if (!actual) {
			missing.push(current);
			return line;
		}
		if (actual === current.version) return line;

		changed.push({ name: current.name, from: current.version, to: actual });
		return `${version[1]}${actual}`;
	});

	if (changed.length) writeFileSync(STACK, lines.join("\n"));

	for (const one of changed) {
		console.log(`  ${one.name}  ${dim(one.from)} -> ${one.to}`);
	}

	blank();
	if (missing.length) {
		warn(
			`${missing.length} entry(ies) name a package the workspace does not declare:`,
		);
		note(missing.map((one) => one.package).join(", "));
		blank();
	}

	ok(
		changed.length
			? `${changed.length} version(s) updated`
			: "Every version already matches",
	);
	blank();
}
