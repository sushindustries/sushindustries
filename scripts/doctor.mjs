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
	const rules = [
		...css.matchAll(/^[\t ]*(\.[\w-]+(?:,\s*\.[\w-]+)*)\s*\{([^}]*)\}/gm),
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

/* ── run ─────────────────────────────────────────────────────────────── */

const list = workspaces();
const registry = readRegistry();

await checkDockerfileCoversWorkspaces(list);
await checkWorkspaceReadmes(list);
checkWorkspaceDescriptions(list);
checkTypecheckHasConfig(list);
checkGeneratedFilesAreOrdered();

checkRegistryFilesExist(registry);
checkRegistryDependenciesResolve(registry);
checkRegistryFilesAreExported(registry);
checkExportsAreRegistered(registry);
await checkRegistryItemsHaveDocs(registry);
checkRegistryItemsHaveDemos(registry);

checkContentFrontmatter();
checkTemplates();
checkGlyphsAreGenerated();
checkDevicesAreGenerated();
checkSkills();
checkDocSectionsAreReal();
checkRegistryItemsAreAddressable(registry);
checkCategoriesHaveIcons();
checkComponentClassesLiveInAtoms();
checkVariantsAreAttributes();
checkBlocksAreEarned();
checkAtomsUseTokens();
checkNoEmDashes();

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
