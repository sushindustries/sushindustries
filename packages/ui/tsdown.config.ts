import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Every source file is an entry, by glob.
 *
 * The point of this package is that a project can install one thing out of
 * it, and a hand-picked entry list quietly stopped keeping that promise: the
 * list froze at eleven while the library grew past thirty, so most components
 * had no subpath and every install of one paid for the barrel. The glob makes
 * the build follow the directory - adding a component adds its entry, its
 * chunk and its generated export, with nothing to remember.
 *
 * Hooks and schema files are entries too, deliberately. `use-scroll-turn` and
 * `archive.schemas` are registry items in their own right, and an installable
 * thing that cannot be imported on its own is a listing, not a library.
 *
 * Two configs, because `registry.ts` lives at the package root: globbed into
 * the first build its common ancestor becomes the package root and every
 * subpath grows a `src/` prefix. So the components build alone (ancestor:
 * `src/`, names clean) and the registry builds second - `clean: false`, or it
 * would wipe the pass before it, and `exports: false`, because the first
 * pass's `customExports` already wrote the `./registry` mapping for both the
 * workspace (source) and the tarball (dist).
 */
export default defineConfig([
	library({
		entry: ["./src/*.tsx", "./src/*.ts"],
		platform: "browser",
		deps: {
			neverBundle: [
				"react",
				"react-dom",
				"@sushindustries/atoms",
				"@tanstack/highlight",
				"@tanstack/markdown",
				"lenis",
				"zod",
			],
		},
		exports: {
			customExports(exports, { isPublish }) {
				exports["./registry"] = isPublish
					? {
							types: "./dist/registry.d.ts",
							import: "./dist/registry.js",
							require: "./dist/registry.cjs",
						}
					: "./registry.ts";
				return exports;
			},
		},
	}),
	{
		entry: { registry: "./registry.ts" },
		format: ["esm", "cjs"],
		platform: "browser",
		target: "es2023",
		dts: true,
		clean: false,
		exports: false,
	},
]);
