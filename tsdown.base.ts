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
	format: ["esm", "cjs"],

	// The same floor `tsconfig.base.json` compiles to. One answer to "what
	// syntax does this ship", rather than one per tool.
	target: "es2023",

	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,

	// `__dirname` and `import.meta.url` both resolve in both formats. Cheap,
	// and the alternative is a runtime error in whichever format was not tested.
	shims: true,

	/*
	 * Not minified, on purpose.
	 *
	 * Everything here is consumed by a bundler that will minify it again, so
	 * the bytes are saved twice and paid for once. What minification does cost
	 * is the function names: oxc turns `function Card` into `function r`, and
	 * every component in this library then appears in somebody else's React
	 * DevTools as a single letter. For a library whose entire premise is that
	 * its components are readable in the projects that install them, that is
	 * the wrong trade.
	 *
	 * `dce-only` is the middle option if dead code ever becomes the problem.
	 */
	minify: false,

	// Generated from the emitted chunks, including `main`/`module`/`types` for
	// resolvers that predate `exports`.
	exports: { legacy: true },

	/*
	 * The two checks that only matter at publish time, so they only run where
	 * publishing happens. `publint` reads the manifest against the tarball;
	 * `attw` resolves the types the way each consumer's TypeScript will.
	 *
	 * `node16` rather than `strict`: nothing here supports `node10` resolution
	 * and pretending otherwise would mean failing a check for a configuration
	 * no consumer of this repo runs.
	 */
	publint: "ci-only",
	attw: { enabled: "ci-only", profile: "node16" },

	// A warning nobody has to act on is a warning nobody reads. Warnings fail
	// the build where builds are gating - which means a genuinely acceptable
	// one has to be suppressed by name, next to the reason it is acceptable.
	failOnWarn: "ci-only",
};

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
	return mergeConfig(shared, overrides);
}
