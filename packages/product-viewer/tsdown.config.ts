import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Four entry points, because two of the dependencies are optional.
 *
 * A single bundled entry would pull zod and three-custom-shader-material into
 * the graph of every consumer, which is the opposite of declaring them optional.
 */
export default defineConfig(
	library({
		entry: {
			index: "src/index.ts",
			schema: "src/schema.ts",
			swatch: "src/swatch.ts",
			"zoned-material": "src/zoned-material.ts",
		},
		platform: "neutral",
	}),
);
