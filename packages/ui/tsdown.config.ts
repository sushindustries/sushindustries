import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"./src/index.ts",
		"./src/reveal.tsx",
		"./src/smooth-scroll.tsx",
		"./src/scroll-spin.tsx",
		"./src/card.tsx",
		"./src/section.tsx",
		"./src/markdown-view.tsx",
		"./src/showcase.tsx",
		"./src/icon.tsx",
		"./src/doc-aside.tsx",
		"./src/archive.tsx",
	],
	format: ["esm", "cjs"],
	dts: true,
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
	clean: true,
});
