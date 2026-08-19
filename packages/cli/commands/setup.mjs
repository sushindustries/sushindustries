/*
 * What this machine is missing, and what to do about each thing.
 *
 * Split in two on purpose. A check is code, because it runs a command or reads
 * a file and has to decide. What to do about a red one is prose, it changes
 * far more often than the check does, and it lives in `setup.md` so that
 * somebody who has just been through the process and found a step missing can
 * fix the instructions without opening this file.
 *
 * Checks are ordered by what they depend on. Node before pnpm, pnpm before
 * install, install before the shards. A red step usually means the ones under
 * it are red for that reason rather than their own, so the first failure is
 * the one to fix.
 *
 * Nothing here writes a secret. Where a value is needed the instructions say
 * which variable and where the value comes from, and leave the setting to you.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REFERENCES, root } from "../lib/context.mjs";
import {
	banner,
	blank,
	bold,
	cyan,
	dim,
	green,
	warn,
	yellow,
} from "../lib/ui.mjs";

const INSTRUCTIONS = join(root, "packages/cli/setup.md");

/**
 * The site's own origin and repository, read rather than written down.
 *
 * `repo.ts` already holds the slug and every link on the site consults it, so
 * a second copy here would be the one that goes stale the day the repo moves -
 * and it would go stale inside the instructions somebody is following to set
 * the thing up, which is the worst place for it.
 */
function identity() {
	const read = (path) => readFileSync(join(root, path), "utf8");
	const slug =
		/REPO_SLUG = "([^"]+)"/.exec(
			read("apps/web/src/modules/content/repo.ts"),
		)?.[1] ?? "";
	const url =
		/url:\s*"(https:[^"]+)"/.exec(
			read("apps/web/src/modules/content/site.catalogue.ts"),
		)?.[1] ?? "";

	return {
		slug,
		owner: slug.split("/")[0] ?? "",
		origin: url.replace(/\/$/, ""),
	};
}

/**
 * `setup.md`, cut into one entry per `## heading`.
 *
 * The tokens are substituted here rather than in each step, so a new step
 * written in Markdown gets them without anybody wiring anything up.
 */
function instructions() {
	const { origin, owner } = identity();
	const source = readFileSync(INSTRUCTIONS, "utf8")
		.replaceAll("{origin}", origin)
		.replaceAll("{owner}", owner);

	const found = new Map();
	for (const block of source.split(/^## /m).slice(1)) {
		const newline = block.indexOf("\n");
		found.set(block.slice(0, newline).trim(), block.slice(newline + 1).trim());
	}
	return found;
}

/** Runs a command and returns its output, or null when it is not there. */
function tryRun(command, args) {
	try {
		return execFileSync(command, args, {
			cwd: root,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	} catch {
		return null;
	}
}

/**
 * Railway's variables for one service, as a map.
 *
 * Parsed rather than searched, because a search for `NAME=` matches a variable
 * that exists and is empty - and an empty credential is exactly the state this
 * wizard should be reporting as unfinished rather than done. Creating the slot
 * is not the same as filling it.
 */
function railwayVars(service) {
	const raw =
		tryRun("railway", ["variables", "--service", service, "--kv"]) ?? "";
	const found = new Map();
	for (const line of raw.split("\n")) {
		const at = line.indexOf("=");
		if (at > 0) found.set(line.slice(0, at).trim(), line.slice(at + 1).trim());
	}
	return found;
}

/** Set, and not set to nothing. */
const filled = (vars, name) => Boolean(vars.get(name));

/*
 * Each check reports one of three states.
 *
 *   ok      nothing to do
 *   todo    something to do; setup.md says what
 *   note    worth knowing, and not a failure
 *
 * `todo` is deliberately not called an error. A machine that has not been set
 * up yet is not broken, and a wizard that opens with eight red lines is one
 * people stop reading.
 */
const CHECKS = [
	{
		id: "node",
		title: "Node 20.17 or newer",
		run() {
			const [major, minor] = process.versions.node.split(".").map(Number);
			const fine = major > 20 || (major === 20 && minor >= 17);
			return fine
				? { state: "ok", detail: `v${process.versions.node}` }
				: { state: "todo", detail: `v${process.versions.node} is too old` };
		},
	},
	{
		id: "pnpm",
		title: "pnpm",
		run() {
			const version = tryRun("pnpm", ["--version"]);
			return version
				? { state: "ok", detail: `v${version}` }
				: { state: "todo", detail: "not installed" };
		},
	},
	{
		id: "install",
		title: "Dependencies installed",
		run() {
			return existsSync(join(root, "node_modules"))
				? { state: "ok", detail: "node_modules is present" }
				: { state: "todo", detail: "nothing installed" };
		},
	},
	{
		id: "refs",
		title: "Reference shards",
		run() {
			const manifest = join(REFERENCES, "index.json");
			if (!existsSync(manifest)) {
				return { state: "todo", detail: "no shards yet" };
			}

			const parsed = JSON.parse(readFileSync(manifest, "utf8"));
			const entries = parsed.providers.reduce((sum, one) => sum + one.total, 0);
			return {
				state: "ok",
				detail: `${parsed.providers.length} providers, ${entries.toLocaleString()} entries, fetched ${parsed.fetchedAt}`,
			};
		},
	},
	{
		id: "railway",
		title: "Railway CLI",
		run() {
			const version = tryRun("railway", ["--version"]);
			if (!version) return { state: "todo", detail: "not installed" };

			return tryRun("railway", ["status"])
				? { state: "ok", detail: `${version}, linked` }
				: { state: "todo", detail: `${version}, not linked` };
		},
	},
	{
		id: "database-url",
		title: "DATABASE_URL",
		run() {
			return process.env.DATABASE_URL
				? { state: "ok", detail: "set in this shell" }
				: { state: "note", detail: "not set here" };
		},
	},
	{
		id: "mcp-token",
		title: "MCP_AUTH_TOKEN",
		run() {
			if (process.env.MCP_AUTH_TOKEN) {
				return { state: "ok", detail: "set in this shell" };
			}
			return filled(railwayVars("web"), "MCP_AUTH_TOKEN")
				? { state: "ok", detail: "set on the deployment" }
				: { state: "todo", detail: "not set anywhere this can see" };
		},
	},
	{
		id: "github-oauth",
		title: "GitHub sign-in for /studio",
		run() {
			const vars = railwayVars("web");
			const empty =
				vars.has("GITHUB_CLIENT_ID") && !filled(vars, "GITHUB_CLIENT_ID");
			const both =
				filled(vars, "GITHUB_CLIENT_ID") &&
				filled(vars, "GITHUB_CLIENT_SECRET");

			if (empty && !both) {
				return {
					state: "todo",
					detail:
						"the variables exist on Railway but are empty - paste the values in",
				};
			}

			return both
				? { state: "ok", detail: "both variables are set" }
				: {
						state: "todo",
						detail: "not configured - /studio falls back to the bearer token",
					};
		},
	},
	{
		id: "rover",
		title: "rover, for the connectors providers",
		run() {
			const version = tryRun("rover", ["--version"]);
			return version
				? { state: "ok", detail: version }
				: { state: "note", detail: "not installed" };
		},
	},
	{
		id: "mcp-registered",
		title: "The MCP server, in Claude Code",
		run() {
			return tryRun("claude", ["mcp", "list"])?.includes("sushindustries")
				? { state: "ok", detail: "registered" }
				: { state: "todo", detail: "not registered" };
		},
	},
];

/** Markdown, indented and lightly coloured. No renderer, and none wanted. */
function render(body) {
	return body
		.split("\n")
		.map((line) => {
			// An indented block is a command. Dimmed, so the prose reads first.
			if (/^ {4}\S/.test(line)) return `     ${dim(line.trim())}`;
			return `     ${line.replace(/\*\*(.+?)\*\*/g, (_, inner) => bold(inner))}`;
		})
		.join("\n");
}

export async function setup() {
	banner("setup");

	const said = instructions();
	let todo = 0;

	for (const check of CHECKS) {
		let result;
		try {
			result = check.run();
		} catch (error) {
			result = { state: "todo", detail: error.message };
		}

		const mark =
			result.state === "ok"
				? green("✔")
				: result.state === "note"
					? dim("·")
					: yellow("○");

		console.log(`  ${mark}  ${bold(check.title)}`);
		if (result.detail) console.log(`     ${dim(result.detail)}`);

		if (result.state !== "ok") {
			if (result.state === "todo") todo++;

			const body = said.get(check.id);
			if (body) console.log(render(body));
			// A check with no entry is a gap in setup.md, and saying so is more
			// useful than printing nothing where the instructions should be.
			else warn(`No "## ${check.id}" section in packages/cli/setup.md.`);
		}
		blank();
	}

	// The other direction: prose nobody checks is prose that goes stale unseen.
	const orphans = [...said.keys()].filter(
		(id) => !CHECKS.some((check) => check.id === id),
	);
	if (orphans.length) {
		warn(`setup.md describes ${orphans.join(", ")}, which nothing checks.`);
		blank();
	}

	if (todo === 0) {
		console.log(`  ${green("Everything is set up.")}`);
	} else {
		console.log(
			`  ${yellow(`${todo} thing(s) to do.`)} ${dim("Fix the first and run this again - the rest often follow.")}`,
		);
		console.log(
			`  ${dim(`The words above come from ${cyan("packages/cli/setup.md")}.`)}`,
		);
	}
	blank();

	// An exit code, so this is usable in CI without parsing text.
	if (todo > 0) process.exitCode = 1;
}
