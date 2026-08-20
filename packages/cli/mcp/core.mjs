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
/**
 * Roughly what a string costs the model that reads it.
 *
 * Four characters per token, the usual approximation for prose and close
 * enough for the only decision it informs: whether this reply is about to be
 * expensive. It errs high on code and punctuation, which is the direction to
 * err in when the cost of being wrong is somebody's context window.
 *
 * `@sushindustries/llms` has the same function and this does not import it:
 * that package ships TypeScript source, and this CLI is plain `.mjs` with no
 * build between it and Node. A build added to serve one twelve-line function
 * would cost more than the duplication does.
 */
export const estimateTokens = (value) => Math.ceil(value.length / 4);

/**
 * The ceiling on any single tool reply, in tokens.
 *
 * Measured rather than guessed. Every tool here answered in under 1,100 tokens
 * except `list-docs`, which returned the whole index at about 5,900 - one call
 * spending more of a window than the question was worth, every time, whether
 * or not the caller wanted all of it.
 *
 * 2,000 is above every honest answer these tools give and well below a dump.
 * A tool that needs more than this is a tool that should be asking the caller
 * to narrow, which is what the note below tells it to do.
 */
const BUDGET = 2000;

/**
 * A tool reply, capped.
 *
 * The cap lives here rather than in each tool on purpose: this is the one
 * function every tool returns through, so a tool cannot be added that forgets
 * it. A budget each caller has to remember is a budget that holds until
 * somebody is in a hurry.
 *
 * Truncation is loud. A reply that stops mid-list with no note is
 * indistinguishable from a list that ends there, and acting on half an index
 * is worse than being told to ask again - so what comes back says how much was
 * cut and what to do instead.
 */
export const text = (value, advice = "Narrow the request and ask again.") => {
	const tokens = estimateTokens(value);

	if (tokens <= BUDGET) {
		return { content: [{ type: "text", text: value }] };
	}

	// Cut at a line, never mid-word: a truncated table row or fence reads as
	// malformed content rather than as a truncation.
	const kept = value.slice(0, BUDGET * 4);
	const body = kept.slice(
		0,
		Math.max(kept.lastIndexOf("\n"), 0) || kept.length,
	);

	return {
		content: [
			{
				type: "text",
				text: `${body}\n\n[cut here: this reply was about ${tokens.toLocaleString()} tokens, over the ${BUDGET.toLocaleString()} limit. ${advice}]`,
			},
		],
	};
};

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
