#!/usr/bin/env node

/*
 * What is missing from this repo, and how to put it back.
 *
 * Every check here exists because something already shipped broken through the
 * gap it covers. A workspace the Dockerfile did not copy. A package with a
 * `typecheck` script and no tsconfig. A generated file that made `tsc` pass on
 * my machine and fail everywhere else. None of those are visible by reading a
 * diff; all of them are visible by reading the directory.
 *
 * The checks that can be repaired without inventing prose are repaired by
 * `--fix`, from the templates in `templates/`. The ones that need a human to
 * write a sentence are reported and left alone, because a scaffolded
 * description that says "TODO" is worse than an empty one - it looks finished.
 *
 *   pnpm doctor          report
 *   pnpm doctor --fix    report, and repair what can be repaired
 *
 * Exit code is 1 if anything is still wrong after fixing. That is what the
 * pre-push hook and CI read.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	DEVICE_CSS,
	DEVICE_SOURCE,
	DEVICE_TYPES,
	devicesProblems,
	readDevices,
	renderDevicesCss,
	renderDeviceTypes,
} from "./devices.mjs";
import {
	GLYPH_OUTPUT,
	GLYPH_SOURCE,
	readGlyphs,
	renderIconComponent,
} from "./glyphs.mjs";
import { loadTemplate, writeFrom } from "./templates.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shouldFix = process.argv.includes("--fix");

/* ── the reporting surface ───────────────────────────────────────────── */

/** @type {Array<{check: string, path: string, message: string, hint?: string}>} */
const problems = [];
/** @type {string[]} */
const repairs = [];

function report(check, path, message, hint) {
	problems.push({ check, path, message, hint });
}

function repaired(what) {
	repairs.push(what);
}

/* ── reading the repo ────────────────────────────────────────────────── */

function read(path) {
	return readFileSync(join(root, path), "utf8");
}

function readJson(path) {
	return JSON.parse(read(path));
}

function exists(path) {
	return existsSync(join(root, path));
}

/** Directories under `apps/` and `packages/` that carry a package.json. */
function workspaces() {
	const found = [];

	for (const group of ["apps", "packages"]) {
		if (!exists(group)) continue;

		for (const entry of readdirSync(join(root, group), {
			withFileTypes: true,
		})) {
			if (!entry.isDirectory()) continue;

			const dir = `${group}/${entry.name}`;
			if (exists(`${dir}/package.json`)) found.push(dir);
		}
	}

	return found.sort();
}

/*
 * Every source file, which is not the same as every tracked file.
 *
 * `--others --exclude-standard` adds the files that are new and not ignored.
 * Without them a component scaffolded a minute ago skips every check here,
 * which is exactly backwards: a new file is the one most likely to be wrong,
 * and the moment before it is committed is the cheapest moment to say so.
 *
 * Filtered by what is on disk, because `ls-files` still lists a file that has
 * been deleted and not staged, and reading one of those throws rather than
 * reporting a problem.
 */
function trackedFiles() {
	const listed = execFileSync(
		"git",
		["ls-files", "--cached", "--others", "--exclude-standard"],
		{ cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
	).split("\n");

	return [...new Set(listed)].filter((path) => path && exists(path));
}

/**
 * Files that exist on disk but are ignored - the ones a clean checkout does
 * not get.
 */
function ignoredFiles() {
	try {
		return execFileSync(
			"git",
			["ls-files", "--others", "--ignored", "--exclude-standard"],
			{ cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
		)
			.split("\n")
			.filter(Boolean);
	} catch {
		return [];
	}
}

/* ── checks ──────────────────────────────────────────────────────────── */

/**
 * Every workspace has a manifest COPY line in the Dockerfile.
 *
 * Docker flattens a glob like `packages/*​/package.json` into one directory and
 * loses the paths pnpm needs to tell the workspaces apart, so the list is
 * written by hand - and a hand-written list that grows is a list that goes
 * stale. It went stale twice.
 */
async function checkDockerfileCoversWorkspaces(list) {
	const dockerfile = read("Dockerfile");
	const missing = list.filter(
		(workspace) => !dockerfile.includes(`COPY ${workspace}/package.json`),
	);

	if (missing.length === 0) return;

	if (shouldFix) {
		const lines = missing.map(
			(workspace) => `COPY ${workspace}/package.json ${workspace}/`,
		);

		// Immediately before the install, which is the only place they work.
		const anchor = "\nRUN pnpm install --frozen-lockfile";
		if (dockerfile.includes(anchor)) {
			writeFileSync(
				join(root, "Dockerfile"),
				dockerfile.replace(anchor, `${lines.join("\n")}\n${anchor}`),
			);
			repaired(`Dockerfile: added ${lines.length} manifest COPY line(s)`);
			return;
		}
	}

	for (const workspace of missing) {
		report(
			"dockerfile",
			workspace,
			"no manifest COPY in the Dockerfile, so the image installs without it",
			`COPY ${workspace}/package.json ${workspace}/`,
		);
	}
}

/*
 * A package nobody can read is a package nobody can use.
 *
 * `packages/` only: the site globs those and renders each README as that
 * package's page, so a missing one is a blank public page. An app is not
 * published and has no page.
 */
async function checkWorkspaceReadmes(list) {
	for (const workspace of list) {
		if (!workspace.startsWith("packages/")) continue;
		if (exists(`${workspace}/README.md`)) continue;

		const manifest = readJson(`${workspace}/package.json`);

		if (shouldFix) {
			await writeFrom("package-readme", `${workspace}/README.md`, {
				name: manifest.name ?? workspace,
				description: manifest.description ?? "",
				slug: workspace.split("/")[1],
			});
			repaired(`${workspace}/README.md`);
			continue;
		}

		report(
			"readme",
			workspace,
			"no README.md - the site renders one per package, so this page is blank",
			"pnpm doctor --fix",
		);
	}
}

/**
 * The site lists every package by its manifest description. An empty one is a
 * blank row on a public page.
 */
function checkWorkspaceDescriptions(list) {
	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		if (manifest.description) continue;

		report(
			"description",
			`${workspace}/package.json`,
			"no description - the packages index renders this, so the entry is blank",
		);
	}
}

/** A `typecheck` script with no tsconfig fails the moment CI runs it. */
function checkTypecheckHasConfig(list) {
	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		if (!manifest.scripts?.typecheck) continue;
		if (exists(`${workspace}/tsconfig.json`)) continue;

		report(
			"tsconfig",
			workspace,
			"has a typecheck script and no tsconfig.json",
		);
	}
}

/**
 * The clean-checkout rule.
 *
 * If a tracked file imports something that is gitignored, then the only reason
 * `tsc` succeeds here is that a previous build left the file behind. In CI the
 * file does not exist and every import downstream of it fails. Declaring
 * `typecheck` after `build` in turbo.json is what makes the order real instead
 * of accidental.
 */
function checkGeneratedFilesAreOrdered() {
	const turbo = readJson("turbo.json");
	const ordered = (turbo.tasks?.typecheck?.dependsOn ?? []).includes("build");
	if (ordered) return;

	const ignored = ignoredFiles().filter(
		(path) => path.includes("/src/") && /\.(gen|generated)\.tsx?$/.test(path),
	);
	if (ignored.length === 0) return;

	const tracked = trackedFiles().filter((path) => /\.tsx?$/.test(path));

	for (const generated of ignored) {
		const stem = generated.replace(/^.*\//, "").replace(/\.tsx?$/, "");
		const importer = tracked.find((path) => read(path).includes(`./${stem}`));
		if (!importer) continue;

		report(
			"clean-checkout",
			importer,
			`imports ${stem}, which is generated and gitignored - typecheck only passes here because a build already ran`,
			'turbo.json: give typecheck "dependsOn": ["^build", "build"]',
		);
	}
}

/* ── the component pipeline ──────────────────────────────────────────── */

/**
 * Registry entries are the contract for `npx shadcn add` and the TanStack CLI.
 * An entry naming a file that does not exist installs an empty component.
 */
function readRegistry() {
	const source = read("packages/ui/registry.ts");
	const items = [];

	for (const block of source.split(/\n\t\{\n/).slice(1)) {
		const name = block.match(/name:\s*"([^"]+)"/)?.[1];
		if (!name) continue;

		const files = (block.match(/files:\s*\[([^\]]*)\]/s)?.[1] ?? "")
			.split(",")
			.map((entry) => entry.trim().replace(/^"|"$/g, ""))
			.filter(Boolean);

		const registryDependencies = (
			block.match(/registryDependencies:\s*\[([^\]]*)\]/s)?.[1] ?? ""
		)
			.split(",")
			.map((entry) => entry.trim().replace(/^"|"$/g, ""))
			.filter(Boolean);

		items.push({
			name,
			files,
			registryDependencies,
			title: block.match(/title:\s*"([^"]+)"/)?.[1] ?? name,
			category: block.match(/category:\s*"([^"]+)"/)?.[1],
			kind: block.match(/kind:\s*"([^"]+)"/)?.[1] ?? "component",
		});
	}

	return items;
}

function checkRegistryFilesExist(items) {
	for (const item of items) {
		for (const file of item.files) {
			if (exists(`packages/ui/src/${file}`)) continue;

			report(
				"registry",
				`packages/ui/registry.ts`,
				`"${item.name}" lists ${file}, which does not exist - installing it copies nothing`,
			);
		}
	}
}

function checkRegistryDependenciesResolve(items) {
	const names = new Set(items.map((item) => item.name));

	for (const item of items) {
		for (const dependency of item.registryDependencies) {
			if (names.has(dependency)) continue;

			report(
				"registry",
				"packages/ui/registry.ts",
				`"${item.name}" depends on registry item "${dependency}", which is not in the registry`,
			);
		}
	}
}

/**
 * Everything the package exports is in the registry.
 *
 * The other direction is already checked: a registry item must be exported.
 * This is the one that actually goes wrong, because adding a file and an export
 * is the natural end of writing a component, and the registry entry is the step
 * that only matters to somebody else. Skip it and the thing exists, works, is
 * importable, and cannot be installed or found - it is in the library without
 * being in the catalogue.
 *
 * `useScrollTurn` shipped exactly that way and nothing noticed.
 */
function checkExportsAreRegistered(items) {
	const registered = new Set(items.flatMap((item) => item.files));
	const barrel = read("packages/ui/src/index.ts");

	for (const [, path] of barrel.matchAll(/from "\.\/([\w-]+)"/g)) {
		const file = ["tsx", "ts"].find((extension) =>
			exists(`packages/ui/src/${path}.${extension}`),
		);
		if (!file) continue;
		if (registered.has(`${path}.${file}`)) continue;

		report(
			"registry",
			`packages/ui/src/${path}.${file}`,
			"is exported but in no registry item, so it cannot be installed or found",
			"add it to packages/ui/registry.ts, or list it in the `files` of the item it belongs to",
		);
	}
}

/** A file people install has to be importable from the package too. */
function checkRegistryFilesAreExported(items) {
	const barrel = read("packages/ui/src/index.ts");

	for (const item of items) {
		for (const file of item.files) {
			const stem = file.replace(/\.tsx?$/, "");
			if (barrel.includes(`./${stem}`)) continue;

			report(
				"exports",
				"packages/ui/src/index.ts",
				`${file} ships in the registry but is not exported from the package`,
				`export * from "./${stem}";`,
			);
		}
	}
}

/**
 * Every rule in atoms.css lives inside a declared layer.
 *
 * The cascade rule the whole system leans on: tokens < base < blocks <
 * utilities, and *unlayered CSS beats all of it*. A selector written at the
 * top level of the file silently outranks every utility on the site - that
 * exact bug shipped once from prose.css, where an unlayered code theme
 * shadowed the code material for days. Inside atoms it would be worse and
 * invisible, so the file's top level admits nothing but `@layer` blocks and
 * the statements that set them up.
 */
function checkAtomsAreLayered() {
	const source = read("packages/atoms/src/atoms.css").replace(
		/\/\*[\s\S]*?\*\//g,
		"",
	);

	let depth = 0;
	let buffer = "";
	for (const char of source) {
		if (char === "{") {
			if (depth === 0) {
				const prelude = buffer.trim();
				if (!prelude.startsWith("@layer")) {
					report(
						"layers",
						"packages/atoms/src/atoms.css",
						`top-level rule outside every layer: \`${prelude.slice(0, 60)}\``,
						"unlayered CSS outranks all four layers; move it into one",
					);
				}
			}
			depth += 1;
			buffer = "";
		} else if (char === "}") {
			depth -= 1;
		} else if (depth === 0) {
			if (char === ";") {
				const statement = buffer.trim();
				if (
					statement &&
					!statement.startsWith("@layer") &&
					!statement.startsWith("@import") &&
					!statement.startsWith("@charset")
				) {
					report(
						"layers",
						"packages/atoms/src/atoms.css",
						`top-level statement outside every layer: \`${statement.slice(0, 60)}\``,
					);
				}
				buffer = "";
			} else {
				buffer += char;
			}
		}
	}
}

/**
 * Every fixed-column grid collapses somewhere.
 *
 * `repeat(3, 1fr)` is three columns forever, including on a phone, where it
 * is three columns of clipped text. A grid in atoms is responsive one of two
 * ways: intrinsically (`auto-fit`/`auto-fill` with `minmax()`), or explicitly
 * (the same class appears again inside a `@media` or `@container` block that
 * overrides it). A fixed count with neither is a layout that only works at
 * the width it was written at.
 */
function checkGridsAreResponsive() {
	const source = read("packages/atoms/src/atoms.css").replace(
		/\/\*[\s\S]*?\*\//g,
		"",
	);

	/*
	 * One pass, tracking whether the rule sits inside a query block. Flat
	 * selectors only, which is what the file contains - the atoms checker
	 * above this one already guards the file's shape.
	 */
	const fixed = new Map(); // selector -> declaration
	const overridden = new Set(); // selectors that appear inside a query

	let depth = 0;
	let inQuery = 0;
	let buffer = "";
	let selector = "";
	for (const char of source) {
		if (char === "{") {
			const prelude = buffer.trim();
			if (
				depth === 1 ||
				(depth === 2 && inQuery) ||
				prelude.startsWith("@media") ||
				prelude.startsWith("@container")
			) {
				if (prelude.startsWith("@media") || prelude.startsWith("@container")) {
					inQuery = depth + 1;
				} else if (inQuery) {
					overridden.add(prelude);
				} else {
					selector = prelude;
				}
			}
			depth += 1;
			buffer = "";
		} else if (char === "}") {
			depth -= 1;
			if (inQuery && depth < inQuery) inQuery = 0;
			buffer = "";
		} else {
			buffer += char;
			if (char === ";" && selector && depth >= 2 && !inQuery) {
				const match = buffer.match(
					/grid-template-columns:\s*repeat\(\s*(\d+)\s*,/,
				);
				if (match && Number(match[1]) > 1) fixed.set(selector, match[1]);
				buffer = "";
			}
		}
	}

	for (const [rule, count] of fixed) {
		/*
		 * Covered when a query block restates the rule's class - matched on the
		 * leading class token, because the override is usually *more general*
		 * (`[data-columns]` covering every `[data-columns="n"]`), so neither
		 * string contains the other whole.
		 */
		const token = rule.match(/\.[\w-]+/)?.[0];
		const covered =
			token !== undefined &&
			[...overridden].some((inner) => inner.includes(token));
		if (covered) continue;

		report(
			"responsive",
			"packages/atoms/src/atoms.css",
			`\`${rule}\` fixes ${count} columns with no @media/@container override`,
			"use repeat(auto-fit, minmax(...)) or collapse it in a query",
		);
	}
}

/**
 * A component that renders another component says so in the registry.
 *
 * The imports in the source are the truth; `registryDependencies` is the
 * copy installers act on. When the two drift, `shadcn add` copies a file
 * whose first import cannot resolve - the component works here and breaks
 * in every project that installs it. So: any runtime import of a sibling
 * module that belongs to a *different* registry item must be declared.
 */
function checkComponentImportsAreDeclared(items) {
	// A shared file like icon.tsx ships in many items, so a stem has a set of
	// owners and any declared one satisfies the import.
	const owners = new Map();
	for (const item of items) {
		for (const file of item.files) {
			const stem = file.replace(/\.tsx?$/, "");
			if (!owners.has(stem)) owners.set(stem, new Set());
			owners.get(stem).add(item.name);
		}
	}

	for (const item of items) {
		const declared = new Set(item.registryDependencies);
		const own = new Set(item.files.map((file) => file.replace(/\.tsx?$/, "")));

		for (const file of item.files) {
			const source = read(`packages/ui/src/${file}`);

			for (const [, stem] of source.matchAll(
				/import\s[^;]*?from\s+"\.\/([\w.-]+)"/g,
			)) {
				if (own.has(stem)) continue;

				const holders = owners.get(stem);
				if (!holders) continue;
				if ([...holders].some((name) => declared.has(name))) continue;

				const [suggestion] = holders;
				report(
					"registry",
					`packages/ui/src/${file}`,
					`imports ./${stem} but "${item.name}" neither ships it nor declares an item that does`,
					`add "${stem}.tsx" to its files, or "${suggestion}" to its registryDependencies`,
				);
			}
		}
	}
}

/** Every registry item gets a page in the museum, so every one needs a doc. */
async function checkRegistryItemsHaveDocs(items) {
	for (const item of items) {
		if (exists(`packages/ui/docs/${item.name}/index.md`)) continue;

		if (shouldFix) {
			await writeFrom(
				"component-index",
				`packages/ui/docs/${item.name}/index.md`,
				{ slug: item.name, title: item.title },
			);
			repaired(`packages/ui/docs/${item.name}/index.md`);
			continue;
		}

		report(
			"docs",
			`packages/ui/docs/${item.name}/`,
			"no index.md - the component page falls back to its registry blurb",
			"pnpm doctor --fix",
		);
	}
}

/**
 * A demo is the difference between a card that shows the component and a card
 * that shows a placeholder. Not fixable: a demo is JSX somebody has to mean.
 */
function checkRegistryItemsHaveDemos(items) {
	const demos = read("apps/web/src/modules/showcase/demos.tsx");

	for (const item of items) {
		if (demos.includes(`"${item.name}"`) || demos.includes(`\n\t${item.name}:`))
			continue;

		report(
			"demo",
			"apps/web/src/modules/showcase/demos.tsx",
			`"${item.name}" has no demo, so its card and its page show nothing running`,
		);
	}
}

/* ── content ─────────────────────────────────────────────────────────── */

/** Frontmatter the catalogues read. A missing key renders as an empty string. */
const REQUIRED_FRONTMATTER = {
	"apps/web/content/posts": ["title", "date", "summary"],
	"packages/ui/docs": ["title", "summary"],
};

function frontmatterKeys(body) {
	const match = body.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	return match[1]
		.split("\n")
		.map((line) => line.slice(0, line.indexOf(":")).trim())
		.filter(Boolean);
}

function checkContentFrontmatter() {
	for (const path of trackedFiles()) {
		if (!path.endsWith(".md")) continue;

		const base = Object.keys(REQUIRED_FRONTMATTER).find((prefix) =>
			path.startsWith(prefix),
		);
		if (!base) continue;

		const keys = frontmatterKeys(read(path));

		if (keys === null) {
			report("frontmatter", path, "no frontmatter block");
			continue;
		}

		for (const required of REQUIRED_FRONTMATTER[base]) {
			if (keys.includes(required)) continue;
			report("frontmatter", path, `missing \`${required}:\``);
		}
	}
}

/**
 * Rendered documents keep a proper heading hierarchy.
 *
 * The routes render each document's title as the page `<h1>`, so a `#` inside
 * a body is a second h1 - two top headings on one page, and an outline that
 * lies to assistive tech and to crawlers alike. Skipped levels (`##` straight
 * to `####`) break the same outline in the other direction.
 *
 * Scoped to documents a route renders. The chrome catalogues (nav.md,
 * footer.md, shelf.md) title themselves because nothing else does.
 */
const RENDERED_MARKDOWN = [
	"apps/web/content/pages/",
	"apps/web/content/posts/",
	"packages/ui/docs/",
];

function checkMarkdownHierarchy() {
	for (const path of trackedFiles()) {
		if (!path.endsWith(".md")) continue;
		if (!RENDERED_MARKDOWN.some((prefix) => path.startsWith(prefix))) continue;

		const body = read(path)
			.replace(/^---\n[\s\S]*?\n---\n/, "")
			.replace(/```[\s\S]*?```/g, "");

		let previous = null;
		for (const match of body.matchAll(/^(#{1,6})\s+(.*)$/gm)) {
			const level = match[1].length;
			const text = match[2].trim();

			if (level === 1) {
				report(
					"hierarchy",
					path,
					`h1 in body: \`# ${text}\``,
					"the route renders the title; start the body at ##",
				);
			}

			if (previous !== null && level > previous + 1) {
				report(
					"hierarchy",
					path,
					`heading skips h${previous} -> h${level} at \`${text}\``,
					"outlines must not skip levels",
				);
			}

			previous = level;
		}
	}
}

/**
 * Every class a shipped component uses is defined in `@sushindustries/atoms`.
 *
 * A component in `packages/ui` is installable. If its styling lives in the
 * site's stylesheet, then installing it gets you unstyled markup and the
 * component only looked finished because it was being read on the one page
 * that happened to have the CSS. `Showcase` was exactly that until this check
 * existed.
 *
 * Classes are read out of `className="..."` literals, which is the only form
 * used here. A computed className would slip past this, and that is the point
 * at which the honest fix is to stop computing it.
 */
function checkComponentClassesLiveInAtoms() {
	const atoms = read("packages/atoms/src/atoms.css");

	/*
	 * Utility-shaped names are checked everywhere, not just in the library.
	 *
	 * A component's own block classes are its business, and the app is allowed
	 * site-only blocks like `.desk-glow`. But `mb-6` is a claim that the scale
	 * has a step called `mb-6`, and when it does not the class silently does
	 * nothing - which is how the home page lost the gap under its intro
	 * paragraph, in markup that looked completely correct.
	 */
	const utility =
		/^(m|mt|mb|mx|my|p|px|py|pt|pb|gap|text|w|h|max-w|min-w|z|flex|items|justify|border|rounded|bg|fg)(-[\w.]+)?$/;

	for (const path of trackedFiles()) {
		const inLibrary = path.startsWith("packages/ui/src/");
		const inApp = path.startsWith("apps/web/src/");
		if (!inLibrary && !inApp) continue;
		if (!path.endsWith(".tsx")) continue;

		// Comments quote class names to explain them. Those are not usage.
		const source = read(path)
			.replaceAll(/\/\*[\s\S]*?\*\//g, "")
			.replaceAll(/^\s*\/\/.*$/gm, "");

		const used = new Set();

		for (const [, value] of source.matchAll(/className="([^"{]*)"/g)) {
			for (const name of value.split(/\s+/)) {
				if (name) used.add(name);
			}
		}

		const undefined_ = [...used].filter(
			(name) =>
				// Outside the library, only utilities are this file's business.
				(inLibrary || utility.test(name)) &&
				!atoms.includes(`.${name} `) &&
				!atoms.includes(`.${name},`) &&
				!atoms.includes(`.${name}:`) &&
				!atoms.includes(`.${name}[`) &&
				!atoms.includes(`.${name}\n`) &&
				!atoms.includes(`.${name}>`),
		);

		for (const name of undefined_) {
			report(
				"atoms",
				path,
				`uses .${name}, which packages/atoms does not define`,
				"a component that only looks right on this site is not installable",
			);
		}
	}
}

/**
 * The icon component matches the glyph table it is generated from.
 *
 * Two failure modes, both silent without this. A glyph added to the Markdown
 * and never generated is a name the types do not have. A glyph edited in the
 * component is a drawing whose stated reason no longer describes it, and the
 * next regeneration throws the edit away.
 */
function checkGlyphsAreGenerated() {
	const glyphs = readGlyphs();

	const empty = glyphs.filter((glyph) => glyph.paths.length === 0);
	for (const glyph of empty) {
		report(
			"glyphs",
			GLYPH_SOURCE,
			`"${glyph.name}" has no path`,
			"draw it, or drop the row - an empty glyph renders as nothing at all",
		);
	}

	if (empty.length > 0) return;

	const expected = renderIconComponent(glyphs);
	if (read(GLYPH_OUTPUT) === expected) return;

	if (shouldFix) {
		writeFileSync(join(root, GLYPH_OUTPUT), expected);
		repaired(`${GLYPH_OUTPUT} from ${GLYPH_SOURCE}`);
		return;
	}

	report(
		"glyphs",
		GLYPH_OUTPUT,
		`does not match ${GLYPH_SOURCE}`,
		"pnpm doctor --fix. Edit the table, never the component",
	);
}

/**
 * The stylesheet and the type module both match the device table.
 *
 * Two outputs from one source, in two languages that cannot read each other: a
 * media query needs a literal `min-width`, and the client needs the same
 * numbers to say which machine it is running on. Generated, they agree by
 * construction. Written twice, they agreed by luck, and the way that breaks is
 * silent - a breakpoint moves in the stylesheet, and the assistant carries on
 * confidently telling a model it is on a laptop.
 */
/**
 * Every skill parses, and every skill is bound to a handler.
 *
 * A malformed skill does not throw at build time. It becomes a tool with a
 * missing description, or a parameter the model has nothing to fill from, and
 * it fails at the one moment nobody is watching - when somebody asks a
 * question and the answer is quietly worse.
 *
 * The binding half is the one that actually goes wrong. Writing the Markdown is
 * the fun part and wiring the handler is the chore, so a skill declared and
 * never bound is the natural end of a half-finished afternoon. It is silently
 * dropped at runtime, so the model simply never gets the capability and nothing
 * anywhere says why.
 */
/**
 * Every docs file lands on a page.
 *
 * Component docs are `packages/<pkg>/docs/<slug>/<section>.md`, and `<section>`
 * is a closed set - `index`, `get-started`, `guides`, `api`, `examples`. A file
 * named anything else is not an error anywhere: the catalogue filters it out,
 * the build passes, and the page renders without it.
 *
 * That happened. `model-mark.md` was written, committed, and rendered nowhere,
 * and the only symptom was a documentation page that quietly did not mention a
 * component. A doc nobody can reach is worse than no doc, because it stops
 * anybody writing the one that would have been read.
 */
function checkDocSectionsAreReal() {
	const source = read(
		"apps/web/src/modules/content/components/components.catalogue.ts",
	);
	const block = source.match(/SECTION_ORDER = \[([\s\S]*?)\]/)?.[1] ?? "";
	const allowed = [...block.matchAll(/"([\w-]+)"/g)].map(([, id]) => id);

	if (allowed.length === 0) return;

	for (const path of trackedFiles()) {
		const match = /^packages\/[^/]+\/docs\/[^/]+\/([\w-]+)\.md$/.exec(path);
		if (!match) continue;
		if (allowed.includes(match[1])) continue;

		report(
			"docs",
			path,
			`"${match[1]}" is not a section, so this file renders on no page at all`,
			`rename it to one of ${allowed.join(", ")}, or give it its own docs/<slug>/index.md`,
		);
	}
}

function checkSkills() {
	const dir = "packages/assistant/skills";
	if (!exists(dir)) return;

	const files = readdirSync(join(root, dir)).filter(
		(name) => name.endsWith(".md") && name !== "README.md",
	);

	const declared = [];

	for (const file of files) {
		const source = read(`${dir}/${file}`);
		const name = source.match(/^name:\s*(.+)$/m)?.[1]?.trim();
		const summary = source.match(/^summary:\s*(.+)$/m)?.[1]?.trim();

		if (!name) {
			report("skills", `${dir}/${file}`, "no `name:` in its frontmatter");
			continue;
		}

		if (!summary) {
			report(
				"skills",
				`${dir}/${file}`,
				"no `summary:` - it is the sentence the model reads when deciding whether to call this",
			);
		}

		if (!/^[a-z][a-z0-9_]*$/.test(name)) {
			report(
				"skills",
				`${dir}/${file}`,
				`"${name}" is not snake_case, which is what every provider's schema expects`,
			);
		}

		if (!/^##\s+Parameters\s*$/m.test(source)) {
			report(
				"skills",
				`${dir}/${file}`,
				"no `## Parameters` table, so it is a tool that takes nothing",
				"write the table, or say so in the notes if it really takes no arguments",
			);
		}

		declared.push(name);
	}

	/*
	 * Bound to a handler, checked by reading the map rather than by running it.
	 * The site's module imports the whole content catalogue, which is not
	 * something a structural check should be paying for.
	 */
	const bindings = "apps/web/src/modules/assistant/skills.server.ts";
	if (!exists(bindings)) return;

	const source = read(bindings);
	const bound = new Set(
		[...source.matchAll(/^\t(?:async )?([a-z][a-z0-9_]*)\(/gm)].map(
			([, name]) => name,
		),
	);

	for (const name of declared) {
		if (bound.has(name)) continue;

		report(
			"skills",
			bindings,
			`"${name}" is declared in ${dir} and bound to nothing, so it is silently dropped and the model never gets it`,
		);
	}

	for (const name of bound) {
		if (declared.includes(name)) continue;

		report(
			"skills",
			bindings,
			`"${name}" is bound but has no file in ${dir}, so it is a handler nothing can call`,
		);
	}
}

/**
 * Every registry item is reachable over MCP.
 *
 * The registry is what an installer reads and `/r/registry.json` is where it
 * reads it from, which is also what makes this library usable by an assistant:
 * an item with a stable `name` and a description is a thing a model can look up
 * and install by id. An item missing either is in the library and not in the
 * catalogue - importable by somebody who already knows it exists, and invisible
 * to everybody else.
 *
 * So this asserts the two fields an id has to have to be one.
 */
function checkRegistryItemsAreAddressable(items) {
	for (const item of items) {
		if (!/^[a-z][a-z0-9-]*$/.test(item.name)) {
			report(
				"mcp",
				"packages/ui/registry.ts",
				`"${item.name}" is not a kebab-case id, so it cannot be a URL segment or an install target`,
			);
		}

		if (item.title === item.name) {
			report(
				"mcp",
				"packages/ui/registry.ts",
				`"${item.name}" has no title of its own, so every listing shows it twice`,
			);
		}
	}
}

function checkDevicesAreGenerated() {
	const devices = readDevices();
	const problems = devicesProblems(devices);

	for (const problem of problems) {
		report("devices", DEVICE_SOURCE, problem);
	}

	if (problems.length > 0) return;

	const outputs = [
		[DEVICE_CSS, renderDevicesCss(devices)],
		[DEVICE_TYPES, renderDeviceTypes(devices)],
	];

	for (const [path, expected] of outputs) {
		if (exists(path) && read(path) === expected) continue;

		if (shouldFix) {
			writeFileSync(join(root, path), expected);
			repaired(`${path} from ${DEVICE_SOURCE}`);
			continue;
		}

		report(
			"devices",
			path,
			`does not match ${DEVICE_SOURCE}`,
			"pnpm doctor --fix. Edit the table, never the output",
		);
	}
}

/**
 * Every registry category has a glyph.
 *
 * The nav and the archive both show a category with its icon. A category
 * without one is a hole in a menu of icons, which reads as a bug rather than
 * as a default.
 */
function checkCategoriesHaveIcons() {
	const source = read("packages/ui/registry.ts");
	const block = source.match(/REGISTRY_CATEGORIES[\s\S]*?\n\];/)?.[0] ?? "";
	const names = new Set(readGlyphs().map((glyph) => glyph.name));

	for (const [, id, icon] of block.matchAll(
		/id:\s*"([^"]+)"[\s\S]*?icon:\s*"([^"]*)"/g,
	)) {
		if (names.has(icon)) continue;

		report(
			"glyphs",
			"packages/ui/registry.ts",
			`category "${id}" uses icon "${icon}", which is not in ${GLYPH_SOURCE}`,
		);
	}

	for (const [, id] of block.matchAll(/\{\s*id:\s*"([^"]+)",\s*label:/g)) {
		const entry = block.slice(block.indexOf(`id: "${id}"`));
		if (entry.slice(0, entry.indexOf("}")).includes("icon:")) continue;

		report("glyphs", "packages/ui/registry.ts", `category "${id}" has no icon`);
	}
}

/**
 * Variants are data attributes, never a second class name.
 *
 * `.card` and `.card--compact` means a consumer has to know both names and can
 * apply half of the pair. `<Card density="compact">` writing
 * `data-density="compact"` cannot be applied halfway, travels with the
 * component when it is installed, and is visible in the props rather than in a
 * stylesheet somebody has to find.
 *
 * So a `--` in a class name here is a variant that escaped the props.
 */
function checkVariantsAreAttributes() {
	for (const path of trackedFiles()) {
		if (!path.startsWith("packages/ui/src/")) continue;
		if (!path.endsWith(".tsx")) continue;

		const source = read(path);

		for (const [, value] of source.matchAll(/className="([^"{]*)"/g)) {
			for (const name of value.split(/\s+/)) {
				if (!name.includes("--")) continue;

				report(
					"variants",
					path,
					`.${name} is a modifier class`,
					"take a prop and write data-*; a modifier class can be applied without its base",
				);
			}
		}
	}
}

/**
 * Colours in atoms come from tokens, including in a variant.
 *
 * The reason to extend a named block with `[data-tone="quiet"]` rather than a
 * new hex value is that the palette then stays one edit wide. A literal colour
 * in a variant is the point at which changing `--accent` stops changing the
 * site.
 */
function checkAtomsUseTokens() {
	const css = read("packages/atoms/src/atoms.css");
	const lines = css.split("\n");

	/*
	 * The `tokens` layer is the definition site, so literals there are the
	 * palette rather than a leak of it. Tracked by layer rather than by
	 * `:root`, because the layer is the thing that says "this is where colours
	 * are allowed to be written down".
	 */
	let inTokens = false;
	let depth = 0;

	for (const [index, line] of lines.entries()) {
		if (line.startsWith("@layer tokens {")) {
			inTokens = true;
			depth = 0;
		}

		if (inTokens) {
			depth += (line.match(/\{/g) ?? []).length;
			depth -= (line.match(/\}/g) ?? []).length;
			if (depth <= 0 && line.includes("}")) inTokens = false;
			continue;
		}
		if (!/#[0-9a-fA-F]{3,8}\b/.test(line)) continue;

		report(
			"tokens",
			`packages/atoms/src/atoms.css:${index + 1}`,
			`literal colour \`${line.trim()}\``,
			"add it to :root and reference the token, so the palette stays one edit wide",
		);
	}
}

/**
 * Is a named block actually a block, or is it utilities in a trench coat?
 *
 * The bargain of atomic CSS is that composition happens in the markup, and the
 * few named blocks exist because they carry something markup cannot say -
 * layout that would take six classes and still be wrong at the breakpoint, a
 * pseudo-element, a state selector, a media query.
 *
 * A block whose every declaration already exists as a utility is not carrying
 * anything. It is the same set of properties written a second time, in a place
 * where changing the scale no longer reaches it, and it is how a stylesheet
 * that started atomic ends up with two ways to say `padding: 16px`.
 *
 * So: build a map from `property: value` to the utility that provides it, then
 * report any block that is fully covered by that map. Blocks with a
 * pseudo-element, a combinator or a state are exempt, because those are exactly
 * the things markup cannot express.
 */
function checkBlocksAreEarned() {
	const css = read("packages/atoms/src/atoms.css");

	/*
	 * Rules, flattened. Nested at-rules are skipped rather than parsed: a rule
	 * inside a media query is responsive, which is one of the reasons a block is
	 * allowed to exist, so it is exempt anyway.
	 */
	/*
	 * Exactly one tab of indentation: a layer's top-level rules. Two tabs is a
	 * rule nested in a media query, and those must not become "providers" - a
	 * responsive override that happens to be one declaration long is not a
	 * utility, and treating it as one flagged `.doc-layout` as recomposable
	 * from a `.showcase-split` breakpoint rule.
	 */
	const rules = [
		...css.matchAll(/^\t(\.[\w-]+(?:,\s*\.[\w-]+)*)\s*\{([^}]*)\}/gm),
	];

	/** `padding-inline: var(--s-4)` -> `.px-4`, from the single-property rules. */
	const provided = new Map();

	for (const [, selector, body] of rules) {
		const declarations = body
			.split(";")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("/*"));

		if (declarations.length !== 1) continue;
		if (selector.includes(",")) continue;

		/*
		 * First writer wins. Utilities are declared at the top of the file, and
		 * plenty of blocks further down also happen to be one declaration long -
		 * without this, `display: none` resolves to whichever component rule
		 * came last rather than to `.hidden`.
		 */
		if (!provided.has(declarations[0])) {
			provided.set(declarations[0], selector.trim());
		}
	}

	for (const [, selector, body] of rules) {
		if (selector.includes(",")) continue;

		const name = selector.trim();

		/*
		 * Exempt if anything else in the file targets this class with more than
		 * its bare name - a state, a pseudo-element, a combinator, an attribute,
		 * or a rule inside a media query.
		 *
		 * Those are precisely the things markup cannot express, so a block that
		 * has one is carrying something. `.tab-panel` looks like `.hidden .p-4`
		 * until you notice a sibling selector turns it back on.
		 */
		const elaborated = new RegExp(
			`\\${name}(?:[:\\[.]|\\s*[>+~]|\\s+\\.)`,
		).test(css);
		if (elaborated) continue;

		/*
		 * Also exempt if a media query restates the bare class. `.nav-row` is
		 * `display: flex` up here and `display: none` below 860px - the block
		 * exists precisely so the breakpoint has one name to take away, which
		 * a utility in the markup cannot be.
		 */
		const overriddenResponsively = new RegExp(
			`^\\t\\t\\${name}\\s*\\{`,
			"m",
		).test(css);
		if (overriddenResponsively) continue;

		const declarations = body
			.split(";")
			.map((line) => line.replace(/\/\*[\s\S]*?\*\//g, "").trim())
			.filter(Boolean);

		if (declarations.length < 2) continue;

		const covered = declarations.filter((line) => provided.has(line));
		if (covered.length !== declarations.length) continue;

		report(
			"atomic",
			"packages/atoms/src/atoms.css",
			`${name} is ${declarations.length} utilities written again`,
			`compose them in the markup: ${covered
				.map((line) => provided.get(line))
				.join(" ")}`,
		);
	}
}

/*
 * House style: no em dashes.
 *
 * A rule about how prose looks is not a rule anyone keeps by remembering it,
 * and biome has no opinion about the characters inside a comment or a Markdown
 * file. So it is checked here, where the repo is already being read.
 *
 * `--fix` rewrites them as a spaced hyphen, which is what the rest of the
 * writing here already uses.
 *
 * The character is written as an escape rather than as itself, because this
 * file is one of the files the fixer rewrites. Spelled literally, the first
 * `--fix` replaced the em dash inside its own detector and the check spent the
 * next run reporting every hyphen in the repo.
 */
const EM_DASH = "\u2014";

function checkNoEmDashes() {
	const text = /\.(md|ts|tsx|css|mjs|json|yml|yaml)$/;

	for (const path of trackedFiles()) {
		if (!text.test(path)) continue;
		if (path.startsWith("packages/product-viewer/")) continue;
		if (path.startsWith("packages/react-product-viewer/")) continue;
		// Vendored upstream, pinned by hash in skills-lock.json. House style
		// does not apply to somebody else's prose, and rewriting it would only
		// make the next `skills update` a conflict.
		if (path.startsWith(".agents/skills/")) continue;

		const body = read(path);
		if (!body.includes(EM_DASH)) continue;

		if (shouldFix) {
			writeFileSync(
				join(root, path),
				body.replaceAll(` ${EM_DASH} `, " - ").replaceAll(EM_DASH, "-"),
			);
			repaired(`${path}: em dashes`);
			continue;
		}

		const count = body.split(EM_DASH).length - 1;
		report("style", path, `${count} em dash(es)`, "pnpm doctor --fix");
	}
}

/**
 * Which templates this repo needs, derived rather than listed.
 *
 * The fixed three are the things `pnpm new` can start. The rest come from the
 * museum: `components.catalogue.ts` builds a component's tab bar from whichever
 * section files exist, so the sections it knows how to render are exactly the
 * sections somebody might have to write, and every one of those deserves a
 * file to start from.
 *
 * Deriving it is the point. A hand-written list of required templates would go
 * stale the first time a section is added, which is the same failure the
 * Dockerfile list already had twice.
 */
function requiredTemplates() {
	const required = new Map([
		["post", "starting a post"],
		["package-readme", "starting a package"],
		["component-source.tsx", "starting a component"],
	]);

	const catalogue = read(
		"apps/web/src/modules/content/components/components.catalogue.ts",
	);
	const sections = catalogue.match(/const SECTION_ORDER = \[([\s\S]*?)\]/)?.[1];

	for (const [, section] of (sections ?? "").matchAll(/"([^"]+)"/g)) {
		required.set(`component-${section}`, `the "${section}" tab of a component`);
	}

	return required;
}

/** Templates are only useful if they exist, and if they say where they go. */
function checkTemplates() {
	if (!exists("templates")) {
		report("templates", "templates/", "missing, so nothing can be scaffolded");
		return;
	}

	const present = new Set(
		readdirSync(join(root, "templates"))
			.filter((entry) => entry.endsWith(".md") && entry !== "README.md")
			.map((entry) => entry.replace(/\.md$/, "")),
	);

	for (const [name, purpose] of requiredTemplates()) {
		if (present.has(name)) continue;

		report(
			"templates",
			`templates/${name}.md`,
			`no template for ${purpose}`,
			"every file somebody has to write by hand is a file written inconsistently",
		);
	}

	for (const name of present) {
		try {
			const { header } = loadTemplate(name);
			if (!header.target) {
				report("templates", `templates/${name}.md`, "header has no `target:`");
			}
		} catch (error) {
			report("templates", `templates/${name}.md`, error.message);
		}
	}
}

/**
 * The build convention, asserted rather than remembered.
 *
 * `packages/ui` published nine subpaths pointing into a `dist/` that its
 * `files` never shipped. Every one of them resolved here, because here the
 * directory exists - it is the tarball that is empty, and nothing in a diff
 * shows you a tarball. publint says so now, but only for a package that runs
 * it, which is the part a config can silently stop doing.
 *
 * So the check is on the config, not the output: a package that builds does it
 * through `tsdown.base.ts`, and a package whose exports name `dist/` ships it.
 */
function checkBuildsShareTheBase(list) {
	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		const config = `${workspace}/tsdown.config.ts`;

		if (manifest.scripts?.build === "tsdown" && !exists(config)) {
			report(
				"build",
				workspace,
				"builds with tsdown and has no tsdown.config.ts",
			);
			continue;
		}
		if (!exists(config)) continue;

		if (!read(config).includes("tsdown.base.ts")) {
			report(
				"build",
				config,
				"does not extend the shared base, so it opts out of publint, attw and generated exports",
				'import { library } from "../../tsdown.base.ts"',
			);
		}

		/*
		 * `exports` is generated, so a wrong path is not the failure mode any
		 * more - a path that is correct and then not published is. `files`
		 * decides that, and nothing generates `files`.
		 */
		const shipsDist = (manifest.files ?? []).some(
			(entry) => entry === "dist" || entry.startsWith("dist/"),
		);
		const usesDist = JSON.stringify(manifest.exports ?? {}).includes("./dist/");

		if (usesDist && !shipsDist) {
			report(
				"build",
				`${workspace}/package.json`,
				"exports resolve into dist/, which `files` does not ship - every subpath 404s from the tarball",
				'add "dist" to `files`',
			);
		}
	}
}

/**
 * A mention that could be a reference, and is not.
 *
 * `MarkdownView` turns backticked mentions of registry items into walkable
 * references - a link wearing a hover card. That only fires on the backticked
 * form, so a doc that writes ScrollSpin as a bare word ships a mention the
 * reader cannot follow, and nothing looks wrong in review.
 *
 * Only multi-hump PascalCase names are checked (`ScrollSpin`, `DocAside`):
 * they are unambiguous component names. Single-word titles like "Card" are
 * ordinary English, and a check that flags prose is a check people disable.
 */
function checkMentionsAreReferences(items) {
	const pascals = items
		.map((item) =>
			item.name
				.split("-")
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(""),
		)
		.filter((name) => /[a-z][A-Z]/.test(name));
	if (pascals.length === 0) return;

	const sources = trackedFiles().filter(
		(path) =>
			(path.startsWith("packages/ui/docs/") ||
				path.startsWith("apps/web/content/posts/") ||
				/^packages\/[^/]+\/README\.md$/.test(path)) &&
			path.endsWith(".md"),
	);

	for (const path of sources) {
		const body = read(path)
			// Fences, inline code and links are already resolved or deliberate.
			.replace(/```[\s\S]*?```/g, "")
			.replace(/`[^`]*`/g, "")
			.replace(/\[[^\]]*\]\([^)]*\)/g, "");

		for (const name of pascals) {
			if (!new RegExp(`(?<![\\w./])${name}(?![\\w])`).test(body)) continue;

			report(
				"references",
				path,
				`mentions ${name} as a bare word, so it does not link or carry its hover card`,
				`write it as \`${name}\` and MarkdownView resolves it`,
			);
		}
	}
}

/* ── construction: boundaries, blocks, reachability ──────────────────── */

/**
 * Routes are leaves of the import graph.
 *
 * A route may import anything; nothing may import a route. The moment a
 * module reaches into `routes/` for a helper, that helper has two owners and
 * the route stops being deletable. The one legal consumer of the generated
 * tree is `router.tsx`, which is what the tree exists for.
 */
function checkRoutesAreLeaves() {
	for (const path of trackedFiles()) {
		if (!path.startsWith("apps/web/src/")) continue;
		if (!/\.(ts|tsx)$/.test(path)) continue;
		if (path.startsWith("apps/web/src/routes/")) continue;
		if (path.endsWith("routeTree.gen.ts")) continue;

		const source = read(path);

		if (/from\s+"[^"]*\/routes\//.test(source)) {
			report(
				"boundaries",
				path,
				"imports from routes/ - routes are leaves, nothing imports them",
				"move the shared piece into apps/web/src/modules/",
			);
		}

		if (
			source.includes("routeTree.gen") &&
			path !== "apps/web/src/router.tsx"
		) {
			report(
				"boundaries",
				path,
				"imports the generated route tree; only router.tsx may",
			);
		}
	}
}

/** Markdown files a route actually renders through MarkdownView. */
function renderedMarkdown() {
	return trackedFiles().filter(
		(path) =>
			path.endsWith(".md") &&
			(path.startsWith("apps/web/content/") ||
				path.startsWith("packages/ui/docs/") ||
				/^packages\/[\w-]+\/README\.md$/.test(path)),
	);
}

/** Block names the renderer can dispatch: the app's map plus the built-ins. */
function markdownBlockNames() {
	const names = new Set(["tabs", "framework"]);
	const source = read("apps/web/src/modules/markdown/blocks.ts");
	const body = /BLOCKS: MarkdownBlocks = \{([\s\S]*?)\};/.exec(source)?.[1];

	if (!body) {
		report(
			"blocks",
			"apps/web/src/modules/markdown/blocks.ts",
			"could not find the BLOCKS map this check reads its truth from",
		);
		return names;
	}

	for (const [, name] of body.matchAll(/^\s*([\w-]+):/gm)) names.add(name);
	return names;
}

/**
 * Every `::start:` block names something registered and is closed in order.
 *
 * An unclosed block swallows the rest of the document silently - the page
 * renders shorter and nothing errors. A misspelled block name renders as
 * nothing at all. Both are authoring mistakes a template system must catch
 * at the gate, not in production.
 */
function checkBlocksResolve() {
	const names = markdownBlockNames();

	for (const path of renderedMarkdown()) {
		const source = read(path);
		const stack = [];

		for (const match of source.matchAll(/<!--\s*::(start|end):([\w-]+)/g)) {
			const [, edge, name] = match;

			if (edge === "start") {
				if (!names.has(name)) {
					report(
						"blocks",
						path,
						`unknown block \`::start:${name}\``,
						`registered blocks: ${[...names].sort().join(", ")}`,
					);
				}
				stack.push(name);
			} else {
				const open = stack.pop();
				if (open !== name) {
					report(
						"blocks",
						path,
						`\`::end:${name}\` closes \`::start:${open ?? "nothing"}\``,
					);
				}
			}
		}

		for (const name of stack) {
			report(
				"blocks",
				path,
				`\`::start:${name}\` is never closed, so it swallows the rest of the document`,
			);
		}
	}
}

/** Demo ids the showcase block can point at, read from demo-sources.ts. */
function demoNames() {
	const source = read("apps/web/src/modules/showcase/demo-sources.ts");
	const names = new Set();
	for (const match of source.matchAll(
		/^\t(?:"([\w-]+)"|([A-Za-z][\w-]*)):/gm,
	)) {
		names.add(match[1] ?? match[2]);
	}
	return names;
}

/**
 * Showcase blocks point at demos that exist, viewer blocks at files that do.
 *
 * `demo="cardd"` renders an empty stage with no error; `model="/models/x.glb"`
 * renders a loading label forever. The registry check catches drift in code;
 * this catches the same drift in content.
 */
function checkBlockTargetsExist() {
	const demos = demoNames();

	for (const path of renderedMarkdown()) {
		const source = read(path);

		for (const [, demo] of source.matchAll(
			/::start:showcase\s[^>]*?demo="([\w-]+)"/g,
		)) {
			if (demos.has(demo)) continue;
			report(
				"blocks",
				path,
				`showcase block points at demo "${demo}", which demo-sources.ts does not define`,
			);
		}

		for (const [, model] of source.matchAll(
			/::start:viewer\s[^>]*?model="(\/[^"]+)"/g,
		)) {
			if (exists(`apps/web/public${model}`)) continue;
			report(
				"blocks",
				path,
				`viewer block points at ${model}, which is not in apps/web/public`,
			);
		}
	}
}

/**
 * Every published page is reachable from somewhere.
 *
 * A page nobody links to is content that exists only for people who guess
 * URLs. The nav, the footer, another page, a post or a doc must mention
 * `/p/<slug>` - drafts are exempt, because a draft is allowed to be nowhere.
 */
function checkPagesAreReachable() {
	const pages = trackedFiles().filter((path) =>
		path.startsWith("apps/web/content/pages/"),
	);

	for (const page of pages) {
		const source = read(page);
		if (/^draft:\s*true/m.test(source)) continue;

		const slug = page.replace(/^.*\/([\w-]+)\.md$/, "$1");
		const target = `/p/${slug}`;

		const linked = trackedFiles().some((other) => {
			if (other === page) return false;
			if (!/\.(md|ts|tsx)$/.test(other)) return false;
			if (!other.startsWith("apps/web/")) return false;
			return read(other).includes(target);
		});

		if (!linked) {
			report(
				"reachability",
				page,
				`nothing links to ${target}`,
				"link it from nav.md, footer.md, or another document - or mark it draft",
			);
		}
	}
}

/**
 * A package README shows how to install and how to use.
 *
 * The README is the package's Markdown mirror - it is the page at
 * /packages/<name>, the llms.txt body, and what npm shows. One with no
 * install line or no code at all documents that the package exists, which
 * the directory listing already did.
 */
function checkReadmesShowUsage() {
	for (const workspace of workspaces()) {
		const path = `${workspace}/README.md`;
		if (!exists(path)) continue; // the missing-README check reports that

		const source = read(path);

		if (!/^## Install/m.test(source)) {
			report(
				"readme",
				path,
				"no `## Install` section",
				"one command per installer, same as every other package here",
			);
		}

		if (!source.includes("```")) {
			report("readme", path, "no code fence - a package README shows usage");
		}
	}
}

/* ── run ─────────────────────────────────────────────────────────────── */

const list = workspaces();
const registry = readRegistry();

/*
 * `--map`: print how this repo is constructed, from the repo itself.
 *
 * The other half of maintaining a system is knowing its shape, and a shape
 * written by hand goes stale the way every second list does. Everything
 * below is read from the same sources the checks read, so it is current by
 * construction - workspaces from pnpm, layers from atoms.css, modules from
 * the directory, the check catalogue from this file's own JSDoc.
 */
if (process.argv.includes("--map")) {
	const atoms = read("packages/atoms/src/atoms.css");
	const layerOrder =
		/@layer ([\w, ]+);/.exec(atoms)?.[1] ?? "(no layer declaration)";

	console.log("# How this repo is constructed\n");

	console.log("## Workspaces\n");
	for (const workspace of list) {
		const meta = JSON.parse(read(`${workspace}/package.json`));
		console.log(`- ${meta.name} (${workspace}) - ${meta.description ?? ""}`);
	}

	console.log(`\n## The cascade\n\nLayer order: ${layerOrder}`);
	for (const name of layerOrder.split(",").map((part) => part.trim())) {
		const blocks = atoms.split(`@layer ${name} {`).length - 1;
		console.log(`- ${name}: ${blocks} block(s) in atoms.css`);
	}

	console.log("\n## Site modules (apps/web/src/modules)\n");
	for (const entry of readdirSync(join(root, "apps/web/src/modules"))) {
		const files = readdirSync(join(root, "apps/web/src/modules", entry));
		console.log(`- ${entry}: ${files.length} file(s)`);
	}

	console.log("\n## Registry\n");
	const byCategory = new Map();
	let blockCount = 0;
	for (const item of registry) {
		byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
		if (item.kind === "block") blockCount += 1;
	}
	console.log(
		`${registry.length} items (${blockCount} blocks): ${[...byCategory]
			.map(([category, count]) => `${category} ${count}`)
			.join(", ")}`,
	);

	console.log("\n## Content\n");
	const content = trackedFiles();
	const count = (prefix) =>
		content.filter((path) => path.startsWith(prefix)).length;
	console.log(`- pages: ${count("apps/web/content/pages/")}`);
	console.log(`- posts: ${count("apps/web/content/posts/")}`);
	console.log(`- component docs: ${count("packages/ui/docs/")}`);
	console.log(`- templates: ${count("templates/")}`);
	console.log(
		`- markdown blocks: ${[...markdownBlockNames()].sort().join(", ")}`,
	);

	console.log("\n## The checks\n");
	const self = read("scripts/doctor.mjs");
	for (const match of self.matchAll(/^(?:async )?function (check\w+)/gm)) {
		/*
		 * The summary is the first line of the JSDoc sitting directly above the
		 * function, when there is one - checks describe themselves or they are
		 * listed bare, which is its own nudge to write the sentence.
		 */
		const before = self.slice(0, match.index);
		let summary = "";
		if (before.trimEnd().endsWith("*/")) {
			const open = before.lastIndexOf("/**");
			const firstLine = /\*\*?\n \* ([^\n]+)/.exec(before.slice(open));
			summary = firstLine ? `: ${firstLine[1]}` : "";
		}
		console.log(`- ${match[1]}${summary}`);
	}

	process.exit(0);
}

await checkDockerfileCoversWorkspaces(list);
await checkWorkspaceReadmes(list);
checkWorkspaceDescriptions(list);
checkTypecheckHasConfig(list);
checkBuildsShareTheBase(list);
checkGeneratedFilesAreOrdered();

checkRegistryFilesExist(registry);
checkRegistryDependenciesResolve(registry);
checkComponentImportsAreDeclared(registry);
checkAtomsAreLayered();
checkGridsAreResponsive();
checkRegistryFilesAreExported(registry);
checkExportsAreRegistered(registry);
await checkRegistryItemsHaveDocs(registry);
checkRegistryItemsHaveDemos(registry);

checkContentFrontmatter();
checkMarkdownHierarchy();
checkTemplates();
checkGlyphsAreGenerated();
checkDevicesAreGenerated();
checkSkills();
checkDocSectionsAreReal();
checkRegistryItemsAreAddressable(registry);
checkMentionsAreReferences(registry);
checkCategoriesHaveIcons();
checkComponentClassesLiveInAtoms();
checkVariantsAreAttributes();
checkBlocksAreEarned();
checkAtomsUseTokens();
checkNoEmDashes();
checkRoutesAreLeaves();
checkBlocksResolve();
checkBlockTargetsExist();
checkPagesAreReachable();
checkReadmesShowUsage();

if (repairs.length > 0) {
	console.log(`Repaired ${repairs.length}:`);
	for (const entry of repairs) console.log(`  + ${entry}`);
	console.log("");
}

if (problems.length === 0) {
	console.log(
		`Healthy. ${list.length} workspaces, ${registry.length} registry items.`,
	);
	process.exit(0);
}

const byCheck = new Map();
for (const problem of problems) {
	const bucket = byCheck.get(problem.check) ?? [];
	bucket.push(problem);
	byCheck.set(problem.check, bucket);
}

console.error(`${problems.length} problem(s):\n`);

for (const [check, bucket] of byCheck) {
	console.error(`${check}`);
	for (const problem of bucket) {
		console.error(`  ${problem.path}`);
		console.error(`    ${problem.message}`);
		if (problem.hint) console.error(`    → ${problem.hint}`);
	}
	console.error("");
}

if (!shouldFix) {
	console.error("Some of these repair themselves: pnpm doctor --fix");
}

process.exit(1);
