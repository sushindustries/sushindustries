/*
 * Do the chart's bars overlap?
 *
 * A chart that renders is not a chart that is readable: bars stacked on each
 * other, labels on top of bars, a scale that puts everything at zero all
 * produce a valid SVG and an unusable picture. None of that is visible to a
 * status code or to the markup tests, which is the gap this closes.
 *
 * Measured in a real browser at two widths, in both directions, with
 * JavaScript off - the site is server-rendered and a layout that only works
 * after hydration is a layout that is wrong on first paint.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

/** Two boxes overlap when they overlap on both axes. A shared edge does not. */
const overlaps = (a, b) =>
	a.x < b.x + b.width - 0.5 &&
	b.x < a.x + a.width - 0.5 &&
	a.y < b.y + b.height - 0.5 &&
	b.y < a.y + a.height - 0.5;

let failures = 0;

for (const viewport of [
	{ width: 360, height: 780, name: "phone" },
	{ width: 1280, height: 900, name: "desktop" },
]) {
	const context = await browser.newContext({
		viewport,
		javaScriptEnabled: false,
	});
	const page = await context.newPage();
	await page.goto(`${BASE}/preview/bar-chart`, {
		waitUntil: "domcontentloaded",
	});

	const found = await page.evaluate(() => {
		const chart = document.querySelector(".chart svg");
		if (!chart) return null;

		// Rects with a real area. A chart's background and its clip paths are
		// also rects, and both are the size of the whole plot.
		const bars = [...chart.querySelectorAll("rect")]
			.map((node) => node.getBoundingClientRect())
			.filter((box) => box.width > 1 && box.height > 1)
			.map(({ x, y, width, height }) => ({ x, y, width, height }));

		const texts = [...chart.querySelectorAll("text")]
			.map((node) => node.getBoundingClientRect())
			.map(({ x, y, width, height }) => ({ x, y, width, height }));

		return {
			bars,
			texts,
			svg: chart.getBoundingClientRect().width,
			plot: chart.getBoundingClientRect().height,
		};
	});

	if (!found) {
		console.log(`${viewport.name.padEnd(8)} NO CHART RENDERED`);
		failures++;
		await context.close();
		continue;
	}

	// The frame and the plot area are rects too, and they legitimately contain
	// the bars. Only same-size-ish siblings are compared.
	const bars = found.bars.filter(
		(box) => box.width < found.svg * 0.98 || box.height < found.plot * 0.98,
	);

	let collisions = 0;
	for (let a = 0; a < bars.length; a++)
		for (let b = a + 1; b < bars.length; b++)
			if (overlaps(bars[a], bars[b])) collisions++;

	let labelHits = 0;
	for (const text of found.texts)
		for (const bar of bars) if (overlaps(text, bar)) labelHits++;

	const flat =
		bars.length > 1 &&
		bars.every(
			(box) => box.width === bars[0].width && box.height === bars[0].height,
		);

	console.log(
		`${viewport.name.padEnd(8)} bars=${String(bars.length).padStart(2)} labels=${String(found.texts.length).padStart(2)} ` +
			`bar-collisions=${collisions} label-over-bar=${labelHits} all-identical=${flat}`,
	);

	if (collisions > 0 || bars.length === 0 || flat) failures++;
	await context.close();
}

await browser.close();
console.log(
	failures === 0 ? "\nOK - nothing stacked" : `\n${failures} problem(s)`,
);
process.exit(failures === 0 ? 0 : 1);
