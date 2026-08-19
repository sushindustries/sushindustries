import { defineConfig } from "vitest/config";

/**
 * Tests live in `tests/`, never in `src/`.
 *
 * A test file under `src/` gets picked up by the bundler's entry graph and ends
 * up shipped, which is both a size problem and an information-leak one.
 */
export default defineConfig({
	test: {
		name: "@sushindustries/product-viewer",
		include: ["tests/**/*.test.ts"],
		// Node, not jsdom: nothing in the core package touches the DOM, and a fake
		// one here would hide an accidental dependency on it.
		environment: "node",
	},
});
