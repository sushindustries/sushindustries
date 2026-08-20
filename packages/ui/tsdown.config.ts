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
				/*
				 * One format, so one mapping. This used to split `types` per
				 * condition, because a single `types` resolved the ESM
				 * declarations against the CJS implementation on `require` -
				 * the "false ESM" attw fails a build for. With no `require`
				 * condition to get wrong, the shape is what it looks like.
				 */
				exports["./registry"] = isPublish
					? {
							types: "./dist/registry.d.ts",
							default: "./dist/registry.js",
						}
					: "./registry.ts";

				return exports;
			},
		},
	}),
	library({
		entry: { registry: "./registry.ts" },
		platform: "browser",
		/*
		 * `clean: false`, or this pass wipes the one before it. `exports:
		 * false`, because the first pass's `customExports` already wrote the
		 * `./registry` mapping for both the workspace and the tarball.
		 *
		 * Through `library()` rather than as a plain object, so format, target
		 * and dts come from the base like every other build here. Spelled out
		 * literally, this chunk kept its own `es2023` and its own format list,
		 * and the day the base changed either one it would have gone on
		 * emitting the old answer with nothing to say so. Restating them is
		 * also what would concat the format array into `["esm", "cjs", "esm",
		 * "cjs"]`, so the safe version and the correct version are the same
		 * version: name only what differs.
		 *
		 * `unused` is off here because it reads the whole manifest against one
		 * pass's imports. This pass builds `registry.ts` alone, which does not
		 * import `zod`, so every dependency the components use looks unused
		 * from inside it. The first pass is the one that sees all the source
		 * and is the one whose answer means anything.
		 */
		clean: false,
		exports: false,
		unused: false,
	}),
]);
