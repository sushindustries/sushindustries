import { defineConfig } from "vitest/config";

/*
 * Deliberately not vite.config.ts: these tests never mount the app inside the
 * runner. The global setup boots the *built* server - the same
 * `.output/server/index.mjs` Railway runs - and every test talks to it over
 * HTTP, so what is asserted is the page a visitor actually receives, not a
 * component tree rendered in a simulator. Loading the Start plugin here would
 * only make the runner slower and the assertion weaker.
 *
 * Two suites, in the order they cost:
 *   semantics.test.ts - fetches every page in the sitemap and checks the
 *     document: one h1, no heading skips, landmarks, resolved blocks, links.
 *   layout.test.ts - opens the same pages in headless Chromium at phone and
 *     desktop widths and checks the geometry: no horizontal overflow, grids
 *     that collapse, a type scale that keeps its order.
 */
export default defineConfig({
	test: {
		// Named like the two package suites are, so a combined run says which
		// project a failure came from rather than leaving this one unlabelled.
		name: "@sushindustries/web",
		include: ["tests/**/*.test.ts"],
		globalSetup: ["tests/setup/serve.ts"],
		// A whole-site crawl in one hook: the budget is the run, not one fetch.
		hookTimeout: 180_000,
		testTimeout: 120_000,
	},
});
