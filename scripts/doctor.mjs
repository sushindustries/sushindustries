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

	for (const path of trackedFiles()) {
		if (!path.startsWith("packages/ui/src/")) continue;
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
	const lines = read("packages/atoms/src/atoms.css").split("\n");
	let inRoot = false;

	for (const [index, line] of lines.entries()) {
		if (line.startsWith(":root")) inRoot = true;
		else if (inRoot && line.startsWith("}")) inRoot = false;

		if (inRoot) continue;
		if (!/#[0-9a-fA-F]{3,8}\b/.test(line)) continue;

		report(
			"tokens",
			`packages/atoms/src/atoms.css:${index + 1}`,
			`literal colour \`${line.trim()}\``,
			"add it to :root and reference the token, so the palette stays one edit wide",
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
await checkRegistryItemsHaveDocs(registry);
checkRegistryItemsHaveDemos(registry);

checkContentFrontmatter();
checkTemplates();
checkComponentClassesLiveInAtoms();
checkVariantsAreAttributes();
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
