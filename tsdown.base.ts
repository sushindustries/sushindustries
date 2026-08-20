import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mergeConfig, type UserConfig } from "tsdown";

/*
 * One build, applied everywhere it applies.
 *
 * Five packages here compile, and until this file existed each one had a
 * different answer to the same questions: whether to tree-shake, whether to
 * emit source maps, whether to check the package before publishing it. The
 * differences were not decisions. They were the order the packages happened to
 * be written in.
 *
 * The interesting part is `exports`. Every packaging bug this repo has shipped
 * came from the same place - a hand-written `exports` map describing a `dist/`
 * that the build had since stopped producing. `packages/ui` pointed nine
 * subpaths at files that do not exist in the tarball, and nothing said so,
 * because a `package.json` is not code and nothing type-checks prose. tsdown
 * writes that map from the files it actually emitted, so the manifest cannot
 * drift from the build any more than a build can drift from itself.
 *
 * That makes `package.json` a generated file in part. CI runs `git diff
 * --exit-code` after the build for exactly that reason: if the build changes
 * the manifest, the change belongs in the commit.
 */

const shared: UserConfig = {
	/*
	 * ESM only, which is also tsdown's own default.
	 *
	 * Dual output was costing 185 files and 602 kB across the workspace to
	 * serve exactly one consumer: our own generated CJS, requiring our other
	 * generated CJS. Nothing else in this repo or on any registry asked for
	 * it, and the site that consumes every one of these packages is ESM.
	 *
	 * The saving is larger than the bytes. A second format is what forces the
	 * shims, the `.d.cts` beside every `.d.ts`, attw's dual-resolution
	 * profile, and the per-condition `types` mapping that `packages/ui` had to
	 * hand-write to stop attw failing on "false ESM". All of that is one
	 * decision, and this is the decision.
	 *
	 * Taken before publishing rather than after, because the day a consumer
	 * exists this stops being free.
	 */
	format: ["esm"],

	// The same floor `tsconfig.base.json` compiles to. One answer to "what
	// syntax does this ship", rather than one per tool.
	target: "es2023",

	/*
	 * Where entry names are measured from, stated rather than inferred.
	 *
	 * Left unset, tsdown takes the common base directory of every entry - so
	 * the day one entry sits outside `src/`, the common base becomes the
	 * package root and every export quietly grows a `./src/` prefix: `"."`
	 * disappears, the app stops resolving the package, and nothing names the
	 * cause. That happened here, on 2026-08-21, adding two entries from a
	 * sibling folder. Pinning the root means an entry outside it is a build
	 * that fails on that entry, rather than a manifest that lies about all of
	 * them. Object-keyed entries (`{ registry: "./registry.ts" }`) name
	 * themselves and are not measured from here.
	 */
	root: "src",

	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,

	/*
	 * No shims. They exist to make `__dirname` and `import.meta.url` resolve
	 * in whichever format lacks them natively, which with one format is
	 * nothing to reconcile. tsdown's own default is off.
	 */
	shims: false,

	/*
	 * Dead-code elimination only, never renaming.
	 *
	 * Everything here is consumed by a bundler that will minify it again, so
	 * whitespace savings are paid for twice. What full minification does cost
	 * is the function names: oxc turns `function Card` into `function r`, and
	 * every component in this library then appears in somebody else's React
	 * DevTools as a single letter. For a library whose entire premise is that
	 * its components are readable in the projects that install them, that is
	 * the wrong trade.
	 *
	 * `dce-only` keeps the names and drops the branches nothing reaches -
	 * compression that costs no readability, which is the only kind this
	 * build is allowed.
	 */
	minify: "dce-only",

	/*
	 * Generated from the emitted chunks, including `main`/`module`/`types` for
	 * resolvers that predate `exports`.
	 *
	 * `devExports` is the half that keeps dev honest: in the workspace,
	 * `exports` points at `src/`, and the `dist/` map lives in `publishConfig`,
	 * which pnpm applies at pack time. Without it the site resolved every
	 * package through `dist` - so an edit to a component did nothing until a
	 * rebuild, and a new export was a module-not-found in a running dev server.
	 * Vite compiles the source either way; only an npm consumer needs the
	 * artefacts, and only the tarball gives them the artefact map.
	 */
	exports: { legacy: true, devExports: true },

	/*
	 * The two checks that only matter at publish time, so they only run where
	 * publishing happens. `publint` reads the manifest against the tarball;
	 * `attw` resolves the types the way each consumer's TypeScript will.
	 *
	 * `esm-only` rather than `node16` or `strict`: these packages emit one
	 * format, so the resolutions worth checking are the ones an ESM consumer
	 * actually takes. Checking `require` paths that no longer exist would fail
	 * the build for a configuration nothing here offers.
	 */
	publint: "ci-only",
	attw: { enabled: "ci-only", profile: "esm-only" },

	/*
	 * The other direction from `deps.onlyImport`: that one fails a build for a
	 * package the output imports and the manifest does not declare, this one
	 * reports a package the manifest declares and nothing imports. Together
	 * they keep the dependency list equal to what the code actually uses.
	 *
	 * `@sushindustries/atoms` is ignored because it is a stylesheet. Nothing
	 * imports it from TypeScript - components wear its class names and the
	 * consumer installs it for the CSS - so it is a real peer dependency that
	 * this check has no way to see being used.
	 */
	unused: {
		level: "warning",
		ignore: ["@sushindustries/atoms"],
	},

	// A warning nobody has to act on is a warning nobody reads. Warnings fail
	// the build where builds are gating - which means a genuinely acceptable
	// one has to be suppressed by name, next to the reason it is acceptable.
	failOnWarn: "ci-only",
};

/**
 * Every package this build is allowed to import, read from its own manifest.
 *
 * A phantom dependency is the packaging bug that a monorepo hides best: an
 * import resolves here because some *other* workspace installed it, the build
 * externalises it happily, and the failure arrives on somebody else's machine
 * as "cannot find module" after they install the tarball. Nothing local can
 * see it, which is the same shape as every deploy failure this repo has
 * already paid for.
 *
 * Derived rather than listed, so it cannot drift: the answer is already in
 * `dependencies` and `peerDependencies`, and a list beside them would be a
 * second copy to forget. Adding a dependency is what permits importing it.
 */
function declaredDependencies(): string[] {
	const manifest = JSON.parse(
		readFileSync(join(process.cwd(), "package.json"), "utf8"),
	) as {
		dependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
	};

	return [
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
	];
}

/**
 * The shared build, plus whatever this package genuinely differs on - which in
 * practice is `entry`, `platform`, and which dependencies must stay external.
 *
 * Merging is `defu`, so arrays concatenate rather than replace: an override
 * adding to `deps.neverBundle` adds to it, and an override restating `format`
 * would produce `["esm", "cjs", "esm", "cjs"]`. Override the things this
 * package differs on, not the things it agrees with.
 */
export function library(overrides: UserConfig = {}): UserConfig {
	return mergeConfig(
		{
			...shared,
			deps: { ...shared.deps, onlyImport: declaredDependencies() },
		},
		overrides,
	);
}
