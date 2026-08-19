#!/usr/bin/env node

/*
 * The README's pictures, taken by a machine.
 *
 * `media/` is what the repository shows on GitHub: a shot of the home page
 * and one of the component archive, in both themes, embedded at the top of
 * the README. Taken by hand they rot; taken here they are reproducible and
 * the doctor can hold them to a deadline.
 *
 *   pnpm media                              build output, own server
 *   pnpm media --base http://localhost:3000 against a server already running
 *
 * Same machinery as `pnpm shots`: Playwright resolved from `apps/web` so no
 * second browser is downloaded, the built server so no dev-only markup is in
 * the frame, fonts awaited and animations disabled so the capture is the
 * settled page and not a frame of its entrance.
 *
 * Everything here has a limit and fails past it. A capture pipeline that
 * hangs in a hook is worse than one that errors: the deadline is the whole
 * run, the timeout is each page, and any page that misses either exits
 * non-zero so `pnpm check` and CI see it.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(root, "apps/web/.output/server/index.mjs");
const OUT = join(root, "media");

/** The pages the README embeds. A new embed gets a line here and nowhere else. */
const PAGES = [
	{ path: "/", name: "home" },
	{ path: "/components", name: "components" },
];

const THEMES = ["light", "dark"];
const VIEWPORT = { width: 1440, height: 900 };
const PAGE_TIMEOUT = 20_000;
const RUN_DEADLINE = 120_000;

const baseFlag = process.argv.indexOf("--base");
const externalBase = baseFlag !== -1 ? process.argv[baseFlag + 1] : undefined;

const deadline = setTimeout(() => {
	console.error(`media: run exceeded ${RUN_DEADLINE / 1000}s, aborting`);
	process.exit(1);
}, RUN_DEADLINE);
deadline.unref();

function freePort() {
	return new Promise((resolve, reject) => {
		const srv = createServer();
		srv.once("error", reject);
		srv.listen(0, "127.0.0.1", () => {
			const { port } = srv.address();
			srv.close(() => resolve(port));
		});
	});
}

async function waitForHealth(base) {
	const until = Date.now() + 30_000;
	while (Date.now() < until) {
		try {
			const res = await fetch(`${base}/health`);
			if (res.ok) return;
		} catch {}
		await new Promise((tick) => setTimeout(tick, 250));
	}
	throw new Error(`server never answered ${base}/health within 30s`);
}

async function serve() {
	if (externalBase) return { base: externalBase, stop: () => {} };

	if (!existsSync(ENTRY)) {
		throw new Error(
			"apps/web/.output/server/index.mjs is missing - run `pnpm build` first, " +
				"or point this at a running server with --base http://localhost:3000",
		);
	}

	const port = await freePort();
	const base = `http://127.0.0.1:${port}`;
	const child = spawn(process.execPath, [ENTRY], {
		env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
		stdio: "ignore",
	});

	await waitForHealth(base);
	return { base, stop: () => child.kill() };
}

const { base, stop } = await serve();
const fromWeb = createRequire(join(root, "apps/web/package.json"));
const { chromium } = fromWeb("playwright");
const browser = await chromium.launch();

mkdirSync(OUT, { recursive: true });

let failed = 0;

for (const theme of THEMES) {
	const context = await browser.newContext({
		viewport: VIEWPORT,
		colorScheme: theme,
		deviceScaleFactor: 2,
		reducedMotion: "reduce",
	});

	/*
	 * The theme is a cookie the server reads, not a media query - emulating
	 * `prefers-color-scheme` alone captures the default theme twice. Same
	 * mechanism the theme toggle writes, set before the first request.
	 */
	await context.addCookies([{ name: "sushi-theme", value: theme, url: base }]);

	for (const { path, name } of PAGES) {
		const page = await context.newPage();
		try {
			const response = await page.goto(`${base}${path}`, {
				waitUntil: "networkidle",
				timeout: PAGE_TIMEOUT,
			});

			if (!response || response.status() >= 400) {
				console.error(`media: ${path} answered ${response?.status()}`);
				failed += 1;
				continue;
			}

			/*
			 * The consent bar answers "no" before the picture is taken: the
			 * steady state of the page is the question already answered, and
			 * declining is the answer that stores nothing to explain.
			 */
			const decline = page.getByRole("button", { name: "Decline" });
			if (await decline.isVisible().catch(() => false)) {
				await decline.click();
			}

			// Fonts before pixels, then one settle tick for anything reduced
			// motion still allows - a capture of the entrance is not the page.
			await page.evaluate(() => document.fonts.ready);
			await page.waitForTimeout(600);

			await page.screenshot({
				path: join(OUT, `${name}-${theme}.webp`),
				type: "webp",
				quality: 88,
				animations: "disabled",
			});
			console.log(`media/${name}-${theme}.webp`);
		} catch (error) {
			console.error(`media: ${path} (${theme}) failed: ${error.message}`);
			failed += 1;
		} finally {
			await page.close();
		}
	}

	await context.close();
}

await browser.close();
stop();

if (failed > 0) {
	console.error(`media: ${failed} capture(s) failed`);
	process.exit(1);
}
