/*
 * What all three servers need, and nothing any one of them owns.
 *
 * Everything these servers can reach is a file in this repository or a page on
 * a public website. There is no credential anywhere in here, which is worth
 * stating rather than assuming: it is the property that makes it safe to hand
 * any of them to an agent and never think about it again.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { root } from "../lib/context.mjs";

/** An MCP text result. */
export const text = (value) => ({ content: [{ type: "text", text: value }] });

/**
 * Resolves a repo-relative path, and refuses anything that leaves the repo.
 *
 * Not decoration. These servers take paths from a model, and
 * `../../.ssh/id_rsa` is a perfectly ordinary looking string. Checking after
 * resolution rather than screening the input is the version that cannot be
 * beaten by an encoding trick, because by then the path is what it is.
 */
export function contained(relativePath) {
	const full = resolve(root, String(relativePath).replace(/^\/+/, ""));
	if (full !== root && !full.startsWith(`${root}/`)) {
		throw new Error("That path is outside the repository.");
	}
	return full;
}

export function readRepo(relativePath) {
	return readFileSync(contained(relativePath), "utf8");
}

const SKIP = new Set([
	"node_modules",
	".git",
	".turbo",
	".output",
	".vite",
	"dist",
	"_artifacts",
	".ruff_cache",
	".playwright-mcp",
]);

/**
 * Every file under `dir` matching `keep`, repo-relative and sorted.
 *
 * `.output` is in the skip list for a reason worth keeping: the built site
 * contains a rendered copy of every Markdown mirror, so walking it would
 * return each document twice and the second copy is generated.
 */
export function walk(dir, keep, found = []) {
	let entries;
	try {
		entries = readdirSync(contained(dir), { withFileTypes: true });
	} catch {
		return found;
	}

	for (const entry of entries) {
		if (SKIP.has(entry.name)) continue;
		if (
			entry.name.startsWith(".") &&
			entry.name !== ".claude" &&
			entry.name !== ".github"
		) {
			continue;
		}

		const path = join(dir, entry.name);
		if (entry.isDirectory()) walk(path, keep, found);
		else if (keep(entry.name)) found.push(relative(root, contained(path)));
	}

	return found.sort();
}

export const bytes = (relativePath) => statSync(contained(relativePath)).size;
