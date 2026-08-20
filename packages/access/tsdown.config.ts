import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Three entries, and the split between them is the boundary this package is
 * built around: `index` is types and constants a browser may hold, the two
 * `.server` entries hash secrets and open connections.
 *
 * `platform: "node"` is the assertion for the pair that need it - they import
 * `node:crypto`, and a build that pretended otherwise would produce a bundle
 * that fails at the first `randomBytes` rather than at the build.
 */
export default defineConfig(
	library({
		entry: [
			"./src/index.ts",
			"./src/tokens.server.ts",
			"./src/invites.server.ts",
		],
		platform: "node",
	}),
);
