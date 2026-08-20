#!/usr/bin/env node

/*
 * A picture of every element, taken on every machine.
 *
 * The hero at the top of a component page shows the component. It could show
 * a live iframe - the archive cards already do - but a hero is the largest
 * thing above the fold and therefore the Largest Contentful Paint element, and
 * an iframe that boots React to draw a button is a very expensive way to be
 * that. So it is a picture, and this is what takes it.
 *
 *   pnpm shots              every element
 *   pnpm shots avatar card  only those two
 *   pnpm shots --base http://localhost:3000   against a server already running
 *
 * The widths are the three machines in `packages/atoms/devices.md`, read from
 * the same table the stylesheet and `device-kinds.ts` are generated from. A
 * fourth machine appears here the moment it appears there, and nothing in this
 * file has to be told about it.
 *
 * The captures are committed. They are build output in every sense except the
 * one that matters: the production image has no browser in it and Railway is
 * not going to grow one to render 65 screenshots on every deploy. Committing
 * them costs a few hundred kilobytes and makes the deploy a file copy.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readDevices } from "./devices.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(root, "apps/web/.output/server/index.mjs");
const OUT = join(root, "apps/web/public/shots");

/*
 * 16:10, which is the laptop's own aspect and the one the hero frame reserves.
 * A card fit centres its subject in whatever box it is given, so the shape is
 * a decision here rather than a property of any component.
 */
const ASPECT = 10 / 16;

const argv = process.argv.slice(2);
const baseFlag = argv.indexOf("--base");
const externalBase = baseFlag === -1 ? null : argv[baseFlag + 1];
const only = argv.filter((entry, index) => {
	if (entry.startsWith("--")) return false;
	if (baseFlag !== -1 && index === baseFlag + 1) return false;
	return true;
});

function freePort() {
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

/** @param {string} base @param {import("node:child_process").ChildProcess} child */
async function waitForHealth(base, child) {
	const deadline = Date.now() + 30_000;

	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			throw new Error(`server exited with code ${child.exitCode} on boot`);
		}
		try {
			if ((await fetch(`${base}/health`)).ok) return;
		} catch {
			// Not listening yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	throw new Error(`server never answered ${base}/health within 30s`);
}

/**
 * The built server, or one already running.
 *
 * The built one, like the tests use, and for the same reason: the dev pipeline
 * injects its own client entry and devtools markers into the stream, so a
 * screenshot of dev is a screenshot of something no visitor sees.
 */
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

	await waitForHealth(base, child);
	return { base, stop: () => child.kill() };
}

const { base, stop } = await serve();

/*
 * The roster comes from the server's own API rather than from parsing
 * `registry.ts`. It is the same list the archive renders, so an element that
 * has a card has a picture by construction.
 */
const registry = await (await fetch(`${base}/api/v1/components`)).json();
const names = registry.components
	.map((item) => item.name)
	.filter((name) => only.length === 0 || only.includes(name))
	.sort();

if (names.length === 0) {
	stop();
	throw new Error(
		only.length > 0
			? `no registry item matches ${only.join(", ")}`
			: "the registry endpoint returned nothing",
	);
}

const devices = readDevices();
mkdirSync(OUT, { recursive: true });

/*
 * A full sweep replaces the whole directory, so an element that was renamed or
 * removed does not leave its picture behind. A named sweep leaves everything
 * else alone, because that is the point of naming one.
 */
if (only.length === 0) {
	for (const file of readdirSync(OUT)) {
		if (file.endsWith(".webp")) rmSync(join(OUT, file));
	}
}

/*
 * Playwright is `apps/web`'s devDependency, not the root's - it is there
 * because the page tests need it, and adding a second copy at the root to
 * satisfy an import path would be a browser downloaded twice. Resolved from
 * the app instead, so this script and the tests drive the same binary.
 */
const fromWeb = createRequire(join(root, "apps/web/package.json"));
const { chromium } = fromWeb("playwright");
const browser = await chromium.launch();

let taken = 0;
let skipped = 0;

for (const device of devices) {
	/*
	 * The table states widths in rem, which is what a stylesheet wants and not
	 * what a viewport takes. 16px per rem is the root size this site sets.
	 */
	const width = Math.round(Number.parseFloat(device.width) * 16);
	const height = Math.round(width * ASPECT);

	const context = await browser.newContext({
		viewport: { width, height },
		/*
		 * One theme, deliberately. The site has three theme states and capturing
		 * each would triple the directory to serve a case the frame already
		 * handles: the shot sits in a bordered, filled frame, so a light picture
		 * on a dark page reads as a picture rather than as a rendering fault.
		 */
		colorScheme: "light",
		deviceScaleFactor: 2,
		reducedMotion: "reduce",
	});

	for (const name of names) {
		const page = await context.newPage();
		try {
			const response = await page.goto(`${base}/preview/${name}?fit=card`, {
				waitUntil: "networkidle",
				timeout: 20_000,
			});

			// A component with no demo has no preview route, and that is not an error.
			if (!response || response.status() >= 400) {
				skipped += 1;
				continue;
			}

			/*
			 * Fonts before pixels. Without this the capture is whatever fallback
			 * face was resolved at first paint, which is a different shape and a
			 * different line count from the page it is a picture of.
			 */
			await page.evaluate(() => document.fonts.ready);

			await page.screenshot({
				path: join(OUT, `${name}-${device.kind}.webp`),
				type: "webp",
				quality: 82,
				animations: "disabled",
			});
			taken += 1;
		} finally {
			await page.close();
		}
	}

	await context.close();
	console.log(`${device.kind} (${width}x${height}): done`);
}

await browser.close();
stop();

/*
 * The manifest is what lets `pnpm run doctor` tell a stale capture from a fresh
 * one without opening a browser itself: a hash of the two files a demo's
 * appearance can actually come from, `demos.tsx` (the element) and
 * `demo-sources.ts` (the source shown beside it). Change either and the hash
 * changes, and the doctor has something to compare against - a fixed
 * ninety-day clock would either nag about elements nobody touched or miss a
 * change made yesterday.
 *
 * Only a full sweep writes it. `pnpm shots avatar` re-captures one element
 * and must not certify the other sixty-eight as current when it never looked
 * at them.
 */
if (only.length === 0) {
	const sourceHash = createHash("sha256")
		.update(readFileSync(join(root, "packages/ui/src/demos.tsx")))
		.update(readFileSync(join(root, "packages/ui/src/demo-sources.ts")))
		.digest("hex");

	writeFileSync(
		join(OUT, "manifest.json"),
		`${JSON.stringify({ sourceHash, capturedAt: new Date().toISOString() }, null, "\t")}\n`,
	);
}

console.log(
	`${taken} shot(s) into apps/web/public/shots${skipped > 0 ? `, ${skipped} element(s) with no preview skipped` : ""}`,
);
