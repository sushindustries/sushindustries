import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * One entry per component, because the point of this package is that a project
 * can install one thing out of it. A single bundled entry would make
 * `@sushindustries/ui/card` cost the same as `@sushindustries/ui`, and the
 * optional peers - `lenis`, `@tanstack/highlight`, `@tanstack/markdown` - would
 * land in the graph of every consumer whether or not they named them.
 *
 * The entries are named rather than listed so that the generated `exports` map
 * takes its subpath names from these keys. Listed, an export would be addressed
 * by where its file happens to sit, and moving a file would rename a public
 * export.
 *
 * `registry` is built like the rest despite not being a component. It is a
 * module the site imports - `REGISTRY_ITEMS`, `REGISTRY_CATEGORIES` - not a
 * document, and shipping it as raw `.ts` meant every consumer resolving
 * `@sushindustries/ui/registry` got a file whose own `import type { IconName }
 * from "./src/icon"` does not resolve under Node16. `pnpm doctor` is unaffected:
 * it reads `packages/ui/registry.ts` by path, as text, and that file still
 * ships.
 */
export default defineConfig(
	library({
		entry: {
			index: "./src/index.ts",
			reveal: "./src/reveal.tsx",
			"smooth-scroll": "./src/smooth-scroll.tsx",
			"scroll-spin": "./src/scroll-spin.tsx",
			card: "./src/card.tsx",
			section: "./src/section.tsx",
			"markdown-view": "./src/markdown-view.tsx",
			showcase: "./src/showcase.tsx",
			icon: "./src/icon.tsx",
			"doc-aside": "./src/doc-aside.tsx",
			archive: "./src/archive.tsx",
			registry: "./registry.ts",
		},
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
	}),
);
