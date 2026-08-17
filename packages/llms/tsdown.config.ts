import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Strings in, strings out - one entry, no dependencies, and nothing that reads
 * a filesystem. `platform: "neutral"` is the assertion: if anything in here
 * ever reaches for `node:fs`, the build fails instead of the browser doing so.
 */
export default defineConfig(
	library({
		entry: ["./src/index.ts"],
		platform: "neutral",
	}),
);
