/*
 * Drizzle Studio, pointed at the deployed database.
 *
 * The database is on Railway's private network, so `DATABASE_URL` as the app
 * sees it names a host that only resolves inside Railway. Reaching it from a
 * laptop means the TCP proxy, and building that URL by hand every time is four
 * variables and a chance to paste a password into a shell history.
 *
 * So this reads them from the Railway CLI, builds the URL in memory, hands it
 * to drizzle-kit as an environment variable and never writes it anywhere. The
 * password is not printed, not logged, and not left in a file.
 *
 * `railway login` first. Nothing here holds a credential of its own.
 */

import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { root } from "../lib/context.mjs";
import { banner, blank, cyan, field, note, warn } from "../lib/ui.mjs";

/** The five variables that make a reachable URL, from the Postgres service. */
function credentials() {
	let raw;
	try {
		raw = execFileSync(
			"railway",
			["variables", "--service", "Postgres", "--kv"],
			{
				cwd: root,
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
	} catch (error) {
		throw new Error(
			`Could not read Railway variables. Run \`railway login\` and \`railway link\` first.\n${error.stderr ?? ""}`.trim(),
		);
	}

	const found = {};
	for (const line of raw.split("\n")) {
		const at = line.indexOf("=");
		if (at === -1) continue;
		found[line.slice(0, at).trim()] = line.slice(at + 1).trim();
	}

	const wanted = [
		"POSTGRES_USER",
		"POSTGRES_PASSWORD",
		"POSTGRES_DB",
		"RAILWAY_TCP_PROXY_DOMAIN",
		"RAILWAY_TCP_PROXY_PORT",
	];

	const missing = wanted.filter((name) => !found[name]);
	if (missing.length) {
		throw new Error(
			`The Postgres service is missing ${missing.join(", ")}. Without the TCP proxy there is no way in from outside Railway.`,
		);
	}

	return found;
}

export async function studio() {
	banner("studio");

	const found = credentials();

	// Percent-encoded, because a generated password can contain characters that
	// mean something in a URL and the failure is an authentication error that
	// looks like a wrong password.
	const url = `postgresql://${encodeURIComponent(found.POSTGRES_USER)}:${encodeURIComponent(
		found.POSTGRES_PASSWORD,
	)}@${found.RAILWAY_TCP_PROXY_DOMAIN}:${found.RAILWAY_TCP_PROXY_PORT}/${found.POSTGRES_DB}`;

	field(
		"host",
		`${found.RAILWAY_TCP_PROXY_DOMAIN}:${found.RAILWAY_TCP_PROXY_PORT}`,
	);
	field("database", found.POSTGRES_DB);
	field("password", "read from Railway, never printed");
	blank();

	warn("This is production. Every table here is a projection except");
	note("page_views and page_feedback, which are the two nothing rebuilds.");
	blank();
	note(`Opening ${cyan("https://local.drizzle.studio")}`);
	blank();

	const port = await freePort();
	if (port !== DEFAULT_PORT) {
		warn(`${DEFAULT_PORT} was taken; using ${port} instead.`);
		note(`https://local.drizzle.studio/?port=${port}`);
		blank();
	}

	const child = spawn(
		"pnpm",
		[
			"exec",
			"drizzle-kit",
			"studio",
			"--host",
			"127.0.0.1",
			"--port",
			String(port),
		],
		{
			cwd: join(root, "packages/db"),
			stdio: "inherit",
			env: { ...process.env, DATABASE_URL: url },
		},
	);

	await new Promise((resolve) => child.on("exit", resolve));
}

/** Drizzle Studio's own default. Tried first so the usual URL keeps working. */
const DEFAULT_PORT = 4983;

/**
 * The first free port from the default upwards.
 *
 * Studio binds without checking and dies on `EADDRINUSE`, which reads as a
 * crash rather than as "one is already open" - and the second one is usually
 * a studio somebody left running, so killing it is the wrong fix. Ten is
 * enough: past that the answer is that something is wrong, not that every port
 * is busy.
 */
async function freePort() {
	const { createServer } = await import("node:net");

	for (let port = DEFAULT_PORT; port < DEFAULT_PORT + 10; port++) {
		const free = await new Promise((resolve) => {
			const probe = createServer();
			probe.once("error", () => resolve(false));
			probe.once("listening", () => probe.close(() => resolve(true)));
			probe.listen(port, "127.0.0.1");
		});
		if (free) return port;
	}

	throw new Error(
		`Ports ${DEFAULT_PORT} to ${DEFAULT_PORT + 9} are all in use. Something other than a stray studio is going on.`,
	);
}
