import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Four entry points, and every one of them is a graph somebody should be able
 * to avoid.
 *
 * `query` and `router` are separate because both TanStack peers are optional -
 * bundling them in would put them in the graph of every consumer, which is the
 * opposite of what `peerDependenciesMeta.optional` promises.
 *
 * `model-mark` is separate for the same reason one level down. It lazily
 * imports the viewer from inside itself, so a page that names a mark ships no
 * three until one becomes live - and that only holds if the mark is reachable
 * without `index`, which statically imports the viewer. Bundlers report this
 * rather than silently undoing it: tsdown warns INEFFECTIVE_DYNAMIC_IMPORT when
 * a module is both statically and dynamically imported.
 *
 * The entries are named rather than listed, because the generated `exports` map
 * takes its subpath names from these keys. Listed, `model-mark` would be
 * addressed by where its file happens to sit - `./elements/model-mark` - and
 * moving the file would rename a public export.
 */
export default defineConfig(
	library({
		entry: {
			index: "src/index.ts",
			query: "src/query.ts",
			router: "src/router.ts",
			"model-mark": "src/elements/model-mark/index.ts",
		},
		platform: "browser",
		exports: {
			/*
			 * Shipped from source, not from `dist`.
			 *
			 * It is optional, so it has to stay a file a consumer chooses to import
			 * rather than something bundled into the JS - but it is also not one
			 * file. `src/styles.css` is a manifest of `@import "./styles/*.css"`,
			 * and copying only the entry into `dist/` produced a stylesheet whose
			 * every import resolved to nothing. `src` ships in `files`, the partials
			 * sit next to it there, and the imports resolve.
			 */
			customExports: {
				"./styles.css": "./src/styles.css",
			},
		},

		/*
		 * A stylesheet has no type declarations, and never will. attw resolves
		 * every subpath in `exports` looking for types and reports three failures
		 * for this one, which is a statement about CSS rather than about this
		 * package. Excluded by name so the check keeps its teeth everywhere else -
		 * `ignoreRules: ['no-resolution']` would have silenced a real missing
		 * entry point just as effectively.
		 */
		attw: { excludeEntrypoints: ["./styles.css"] },

		/*
		 * `index` and `model-mark` each export a default alongside their named
		 * exports, so rolldown warns that CJS consumers reach the default through
		 * `.default`. They do, and that is the intended shape: `cjsDefault` only
		 * collapses to `module.exports =` for a lone default export, so nothing
		 * here is ambiguous - the warning describes the behaviour rather than a
		 * defect in it. Suppressed by name so `failOnWarn` stays useful.
		 */
		suppressWarnings: [/MIXED_EXPORTS/],
	}),
);
