import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

/*
 * Boot the built server once for the whole run.
 *
 * The tests exercise `.output/server/index.mjs` - the artefact that ships -
 * rather than the dev server, because the dev pipeline injects its own client
 * entry and devtools attributes into the stream, and a check that passes
 * against markup production never serves is a check against nothing.
 *
 * The build is a prerequisite, not a side effect: turbo orders `test` after
 * `build`, and the hook and CI both build first. If the output is missing the
 * run refuses with the command to fix it instead of testing a stale artefact.
 */

const ENTRY = fileURLToPath(
	new URL("../../.output/server/index.mjs", import.meta.url),
);

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once("error", reject);
		probe.listen(0, "127.0.0.1", () => {
			const address = probe.address();
			if (address === null || typeof address === "string") {
				probe.close();
				reject(new Error("could not allocate a port"));
				return;
			}
			probe.close(() => resolve(address.port));
		});
	});
}

async function waitForHealth(base: string, child: ChildProcess): Promise<void> {
	const deadline = Date.now() + 30_000;

	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			throw new Error(`server exited with code ${child.exitCode} on boot`);
		}
		try {
			const response = await fetch(`${base}/health`);
			if (response.ok) return;
		} catch {
			// Not listening yet; keep polling.
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	throw new Error(`server never answered ${base}/health within 30s`);
}

export default async function serve(project: TestProject): Promise<() => void> {
	if (!existsSync(ENTRY)) {
		throw new Error(
			"apps/web/.output/server/index.mjs is missing - run `pnpm build` first. " +
				"The page tests run against the built server, never the dev one.",
		);
	}

	const port = await freePort();
	const base = `http://127.0.0.1:${port}`;

	/*
	 * stderr is kept, not ignored. A server that dies mid-run does not say so:
	 * the next test to fetch sees `ECONNRESET` and fails with a message about a
	 * socket, while the stack trace that would name the cause went nowhere.
	 * Buffering it costs nothing while the server is healthy and is the whole
	 * diagnosis when it is not.
	 */
	const child = spawn(process.execPath, [ENTRY], {
		env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
		stdio: ["ignore", "ignore", "pipe"],
	});

	let stderr = "";
	child.stderr?.setEncoding("utf8");
	child.stderr?.on("data", (chunk: string) => {
		stderr += chunk;
	});

	let stopped = false;
	child.on("exit", (code, signal) => {
		if (stopped) return;
		console.error(
			`\n[serve] the built server exited early (code ${code}, signal ${signal}).` +
				` Every fetch after this point fails with ECONNRESET.\n${stderr}`,
		);
	});

	await waitForHealth(base, child);
	project.provide("baseUrl", base);

	return () => {
		stopped = true;
		child.kill();
	};
}

declare module "vitest" {
	export interface ProvidedContext {
		baseUrl: string;
	}
}
