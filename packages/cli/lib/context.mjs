/*
 * Where this repository is, from wherever the command was launched.
 *
 * Every other file resolves paths through `root`, because the CLI is run three
 * ways and only one of them has a sensible working directory: from a terminal
 * inside the repo, from `pnpm adam-jurek` at the workspace root, and from
 * Claude Code launching an MCP server as a child process with a cwd nobody
 * chose. Deriving it from this file's own location is the only one of those
 * that is always right, and it is what lets the plugin point at the checkout
 * it was installed from without being told where that is.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Where this file sits: the checkout, or the installed copy of the package. */
const installed = resolve(here, "../../..");

/**
 * The repository whose documents the tools answer about.
 *
 * Where this file lives, unless somebody has explicitly said otherwise with
 * `ADAM_JUREK_ROOT`. Deliberately *not* the working directory: an earlier
 * version walked up from `cwd` looking for a `.git`, which would have meant
 * launching the MCP server from any other project silently indexed that
 * project instead - reading files from an unrelated repository because of
 * where a terminal happened to be. A tool that changes what it reads based on
 * where it was started is a tool nobody can reason about.
 *
 * So: this repository by default, another only when named. The override is
 * what lets somebody point it at their own checkout on purpose, which is a
 * different act from doing it by accident.
 */
const told = process.env.ADAM_JUREK_ROOT;

export const root = told ? resolve(told) : installed;

/*
 * The stack, and the shards cut from it.
 *
 * Both live inside this package rather than somewhere central, because this is
 * the only thing that reads them and a published copy of the CLI has to carry
 * them to be useful offline. One directory owns the data and the program that
 * serves it, which is the same rule the rest of the repo follows.
 */
const CLI = resolve(here, "..");

/** One entry per thing this repo depends on. Hand written. */
export const STACK = join(CLI, "stack.yaml");

/** Sharded provider indexes, written by `pnpm sushindustries refs`. */
export const REFERENCES = join(CLI, "references");

export const flags = new Set(
	process.argv.slice(2).filter((a) => a.startsWith("--")),
);

/** Read a repo-relative file, or return the fallback rather than throwing. */
export function read(relative, fallback = null) {
	try {
		return readFileSync(join(root, relative), "utf8");
	} catch {
		if (fallback === null) throw new Error(`Missing ${relative}`);
		return fallback;
	}
}

/**
 * Reads `stack.yaml` without a YAML parser.
 *
 * The file is deliberately one shape - a list of items, one `key: value` per
 * line, no nesting - so the twenty lines below are the whole grammar and this
 * package needs no dependency to read its own data. The moment that stops
 * being true the answer is to fix the file, not to add a parser: nesting in
 * here would mean the table it generates could no longer be a table.
 */
export function parseStack(source) {
	const items = [];
	let current = null;

	for (const raw of source.split("\n")) {
		const line = raw.replace(/\s+$/, "");
		if (!line.trim() || line.trimStart().startsWith("#")) continue;

		const started = line.match(/^-\s+(\w+):\s*(.*)$/);
		if (started) {
			current = {};
			items.push(current);
			current[started[1]] = unquote(started[2]);
			continue;
		}

		const pair = line.match(/^\s+(\w+):\s*(.*)$/);
		if (pair && current) current[pair[1]] = unquote(pair[2]);
	}

	return items;
}

const unquote = (value) => value.trim().replace(/^"(.*)"$/, "$1");
