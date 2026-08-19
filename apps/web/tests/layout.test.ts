import { type Browser, type BrowserContext, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, test } from "vitest";
import { sitemapPagePaths } from "./setup/roster";

/*
 * The geometry, checked in a real browser.
 *
 * The semantics suite reads the document; this one measures it. Chromium
 * renders every sitemap page at a phone width and a desktop width and the
 * tests assert the things a parser cannot see: nothing wider than the
 * viewport, grids that actually collapse, a type scale whose order survives
 * computed styles.
 *
 * JavaScript stays off. The site is fully server-rendered, so layout is the
 * server's responsibility and hydration must not be the thing that fixes an
 * overflow. Images, media and the archive's preview iframes are aborted -
 * they cost seconds per page and the boxes they leave behind still have their
 * CSS dimensions, which is the half layout cares about.
 *
 * Locally, a machine without the browser skips with a warning and the command
 * to fix it. CI never skips: `pnpm exec playwright install chromium`.
 */

const PHONE = { width: 360, height: 780 };
const DESKTOP = { width: 1280, height: 900 };

let browser: Browser | null = null;
let unavailable = "";

try {
	browser = await chromium.launch();
} catch (error) {
	if (process.env.CI) throw error;
	unavailable = String(error);
}

if (browser === null) {
	console.warn(
		`layout tests skipped - Chromium is not installed (${unavailable.split("\n")[0]}). Run: pnpm exec playwright install chromium`,
	);
}

let base = "";
let paths: string[] = [];

async function contextAt(viewport: {
	width: number;
	height: number;
}): Promise<BrowserContext> {
	if (browser === null) throw new Error("no browser");
	const context = await browser.newContext({
		viewport,
		javaScriptEnabled: false,
	});
	await context.route("**/preview/**", (route) => route.abort());
	await context.route("**/*.glb", (route) => route.abort());
	await context.route("**/*", (route) =>
		["image", "media"].includes(route.request().resourceType())
			? route.abort()
			: route.continue(),
	);
	return context;
}

beforeAll(async () => {
	base = inject("baseUrl");
	paths = await sitemapPagePaths(base);
	expect(paths.length).toBeGreaterThan(0);
});

afterAll(async () => {
	await browser?.close();
});

describe.runIf(browser !== null)("every page, measured", () => {
	test.each([PHONE, DESKTOP])(
		"nothing overflows a $width px viewport",
		async (viewport) => {
			const context = await contextAt(viewport);
			const page = await context.newPage();
			const offenders: string[] = [];

			for (const path of paths) {
				/*
				 * "load", not "domcontentloaded". With page scripts disabled,
				 * nothing blocks DCL on the stylesheet, so an early measurement
				 * reads a page whose CSS has not applied yet - which looks
				 * exactly like a 285px overflow and reproduces on no real
				 * visit. Fonts settle before measuring for the same reason.
				 */
				await page.goto(base + path, { waitUntil: "load" });
				const fault = await page.evaluate(async () => {
					await document.fonts.ready;
					const root = document.documentElement;
					const spill = root.scrollWidth - root.clientWidth;
					if (spill <= 1) return null;

					// Name the widest culprits so the failure is actionable.
					const wide = [...document.querySelectorAll("*")]
						.filter((element) => {
							const rect = element.getBoundingClientRect();
							return rect.right > root.clientWidth + 1 && rect.width > 1;
						})
						.slice(0, 3)
						.map(
							(element) =>
								`${element.tagName.toLowerCase()}.${element.className
									.toString()
									.split(" ")
									.slice(0, 3)
									.join(".")}`,
						);
					return `${spill}px spill (${wide.join(", ")})`;
				});
				if (fault) offenders.push(`${path} at ${viewport.width}px: ${fault}`);
			}

			await context.close();
			expect(offenders).toStrictEqual([]);
		},
	);

	/*
	 * The other edge, which the overflow check cannot see.
	 *
	 * A negative left offset does not extend `scrollWidth`, so a element hanging
	 * off the left of the screen produces no spill and no scrollbar - the
	 * browser just clips it and says nothing. The cinema video bled a flat
	 * margin into a gutter that was not there and lost 48px of picture at
	 * 1024px, through a suite that checked three widths for overflow and passed
	 * every time.
	 *
	 * Left is the only side worth checking this way: anything off the right
	 * extends the scroll width and the test above already has it.
	 */
	test.each([PHONE, DESKTOP])(
		"nothing is clipped off the left edge at $width px",
		async (viewport) => {
			const context = await contextAt(viewport);
			const page = await context.newPage();
			const offenders: string[] = [];

			for (const path of paths) {
				await page.goto(base + path, { waitUntil: "load" });
				const fault = await page.evaluate(async () => {
					await document.fonts.ready;

					const clipped = [...document.querySelectorAll("main *")]
						.filter((element) => {
							const rect = element.getBoundingClientRect();
							/*
							 * A hair of rounding is not a bug; a visible slice is.
							 * Zero-size elements are skipped because a collapsed
							 * node at -1px is not something anyone can see.
							 */
							return rect.left < -2 && rect.width > 4 && rect.height > 4;
						})
						.slice(0, 3)
						.map(
							(element) =>
								`${element.tagName.toLowerCase()}.${element.className
									.toString()
									.split(" ")
									.slice(0, 2)
									.join(".")} at ${Math.round(
									element.getBoundingClientRect().left,
								)}px`,
						);

					return clipped.length > 0 ? clipped.join(", ") : null;
				});
				if (fault) offenders.push(`${path} at ${viewport.width}px: ${fault}`);
			}

			await context.close();
			expect(offenders).toStrictEqual([]);
		},
	);

	test("the Markdown grid block expands on desktop and stacks on a phone", async () => {
		const cards = '.grid-auto[data-columns="3"] > *';

		const desktop = await contextAt(DESKTOP);
		const wide = await desktop.newPage();
		await wide.goto(`${base}/p/markdown`, { waitUntil: "load" });
		const wideTops = await wide.$$eval(cards, (elements) =>
			elements.map((element) =>
				Math.round(element.getBoundingClientRect().top),
			),
		);
		await desktop.close();

		const phone = await contextAt(PHONE);
		const narrow = await phone.newPage();
		await narrow.goto(`${base}/p/markdown`, { waitUntil: "load" });
		const narrowTops = await narrow.$$eval(cards, (elements) =>
			elements.map((element) =>
				Math.round(element.getBoundingClientRect().top),
			),
		);
		await phone.close();

		expect(wideTops.length).toBe(3);
		// Side by side: one row, so one distinct top.
		expect(new Set(wideTops).size).toBe(1);
		// Stacked: every card starts below the one before it.
		expect(new Set(narrowTops).size).toBe(narrowTops.length);
	});

	test("the type scale keeps its order on a component page", async () => {
		const context = await contextAt(DESKTOP);
		const page = await context.newPage();
		await page.goto(`${base}/components/button`, {
			waitUntil: "load",
		});

		const sizes = await page.evaluate(() => {
			const sizeOf = (selector: string) => {
				const element = document.querySelector(selector);
				return element
					? Number.parseFloat(getComputedStyle(element).fontSize)
					: 0;
			};
			return {
				h1: sizeOf("main h1"),
				h2: sizeOf("main h2"),
				body: Number.parseFloat(getComputedStyle(document.body).fontSize),
			};
		});
		await context.close();

		expect(sizes.h1).toBeGreaterThan(sizes.h2);
		expect(sizes.h2).toBeGreaterThanOrEqual(sizes.body);
		expect(sizes.body).toBeGreaterThanOrEqual(14);
	});
});
