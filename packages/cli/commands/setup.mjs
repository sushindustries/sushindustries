/*
 * What this machine is missing, and what to do about each thing.
 *
 * A wizard rather than a script, because most of these steps cannot be
 * automated honestly: creating a GitHub OAuth app is a form on somebody
 * else's website, and a command that claims to have done it would be lying.
 * So this checks, reports, and hands over the exact next action - which is the
 * part people actually get wrong.
 *
 * Every check is ordered by what it depends on. Node before pnpm, pnpm before
 * install, install before the shards, shards before the sync. A red step
 * usually means the ones under it are red for that reason and not for their
 * own, so the first failure is the one to fix.
 *
 * Nothing here writes a secret. Where a value is needed it says which variable
 * and where the value comes from, and leaves the setting to you.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { REFERENCES, root } from "../lib/context.mjs";
import { banner, blank, bold, cyan, dim, green, yellow } from "../lib/ui.mjs";

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

/*
 * Each step reports one of three states.
 *
 *   ok      nothing to do
 *   todo    something to do, and the line under it is the thing
 *   note    worth knowing, and not a failure
 *
 * `todo` is deliberately not called an error. A machine that has not been set
 * up yet is not broken, and a wizard that prints eight errors on first run is
 * one people stop reading.
 */
const STEPS = [
	{
		title: "Node 20.17 or newer",
		check() {
			const [major, minor] = process.versions.node.split(".").map(Number);
			const fine = major > 20 || (major === 20 && minor >= 17);
			return fine
				? { state: "ok", detail: `v${process.versions.node}` }
				: {
						state: "todo",
						detail: `v${process.versions.node} is too old`,
						fix: "Install Node 22, which is what the Dockerfile runs.",
					};
		},
	},
	{
		title: "pnpm",
		check() {
			const version = tryRun("pnpm", ["--version"]);
			return version
				? { state: "ok", detail: `v${version}` }
				: {
						state: "todo",
						detail: "not installed",
						fix: "corepack enable",
					};
		},
	},
	{
		title: "Dependencies installed",
		check() {
			return existsSync(join(root, "node_modules"))
				? { state: "ok", detail: "node_modules is present" }
				: { state: "todo", detail: "nothing installed", fix: "pnpm install" };
		},
	},
	{
		title: "Reference shards",
		check() {
			if (!existsSync(join(REFERENCES, "index.json"))) {
				return {
					state: "todo",
					detail: "no shards yet",
					fix: "pnpm sushindustries refs",
				};
			}
			const manifest = JSON.parse(
				execFileSync("cat", [join(REFERENCES, "index.json")], {
					encoding: "utf8",
				}),
			);
			const entries = manifest.providers.reduce(
				(sum, one) => sum + one.total,
				0,
			);
			return {
				state: "ok",
				detail: `${manifest.providers.length} providers, ${entries.toLocaleString()} entries, fetched ${manifest.fetchedAt}`,
			};
		},
	},
	{
		title: "Railway CLI",
		check() {
			const version = tryRun("railway", ["--version"]);
			if (!version) {
				return {
					state: "todo",
					detail: "not installed",
					fix: "brew install railway   (only needed for sync and studio)",
				};
			}
			const linked = tryRun("railway", ["status"]);
			return linked
				? { state: "ok", detail: `${version}, linked` }
				: {
						state: "todo",
						detail: `${version}, not linked`,
						fix: "railway login && railway link",
					};
		},
	},
	{
		title: "DATABASE_URL",
		check() {
			if (process.env.DATABASE_URL) {
				return { state: "ok", detail: "set in this shell" };
			}
			return {
				state: "note",
				detail: "not set here",
				fix: "Not needed for most commands. `pnpm sushindustries studio` builds it from Railway on its own; `sync` needs it exported.",
			};
		},
	},
	{
		title: "MCP_AUTH_TOKEN",
		check() {
			if (process.env.MCP_AUTH_TOKEN) {
				return { state: "ok", detail: "set in this shell" };
			}
			const remote = tryRun("railway", [
				"variables",
				"--service",
				"web",
				"--kv",
			]);
			if (remote?.includes("MCP_AUTH_TOKEN=")) {
				return {
					state: "ok",
					detail: "set on the deployment",
				};
			}
			return {
				state: "todo",
				detail: "not set anywhere this can see",
				fix: "Generate one and set it on the web service:\n      node -e \"console.log(require('node:crypto').randomBytes(32).toString('base64url'))\"\n      railway variables --service web --set MCP_AUTH_TOKEN=<value>",
			};
		},
	},
	{
		title: "GitHub sign-in for /studio",
		check() {
			const remote = tryRun("railway", [
				"variables",
				"--service",
				"web",
				"--kv",
			]);
			const has = (name) => remote?.includes(`${name}=`);

			if (has("GITHUB_CLIENT_ID") && has("GITHUB_CLIENT_SECRET")) {
				return { state: "ok", detail: "both variables are set" };
			}

			return {
				state: "todo",
				detail: "not configured - /studio falls back to the bearer token",
				fix: [
					"Create an OAuth app, then set the two variables it gives you:",
					"",
					`      1. ${cyan("https://github.com/settings/developers")}  ->  New OAuth App`,
					"      2. Homepage URL:      https://adamjurek.com",
					"      3. Callback URL:      https://adamjurek.com/auth/github/callback",
					"      4. Generate a client secret",
					"",
					"      railway variables --service web \\",
					"        --set GITHUB_CLIENT_ID=<id> \\",
					"        --set GITHUB_CLIENT_SECRET=<secret>",
					"",
					"      No scopes are requested. The only question asked is who you are.",
				].join("\n"),
			};
		},
	},
	{
		title: "The MCP server, in Claude Code",
		check() {
			const listed = tryRun("claude", ["mcp", "list"]);
			if (listed?.includes("sushindustries")) {
				return { state: "ok", detail: "registered" };
			}
			return {
				state: "todo",
				detail: "not registered",
				fix: "`.mcp.json` at the repo root registers it when you open this\n      directory in Claude Code. Approve it once when prompted, or see\n      `pnpm sushindustries mcp install` for the other three ways.",
			};
		},
	},
];

export async function setup() {
	banner("setup");

	let todo = 0;

	for (const step of STEPS) {
		let result;
		try {
			result = step.check();
		} catch (error) {
			result = { state: "todo", detail: error.message };
		}

		const mark =
			result.state === "ok"
				? green("✔")
				: result.state === "note"
					? dim("·")
					: yellow("○");

		console.log(`  ${mark}  ${bold(step.title)}`);
		if (result.detail) console.log(`     ${dim(result.detail)}`);

		if (result.fix && result.state !== "ok") {
			if (result.state === "todo") todo++;
			console.log(`     ${result.fix.split("\n").join("\n     ")}`);
		}
		blank();
	}

	if (todo === 0) {
		console.log(`  ${green("Everything is set up.")}`);
	} else {
		console.log(
			`  ${yellow(`${todo} thing(s) to do.`)} ${dim("Fix the first one and run this again - the rest often follow.")}`,
		);
	}
	blank();

	// Exit code, so this is usable in a script and in CI without parsing text.
	if (todo > 0) process.exitCode = 1;
}
