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
 *   pnpm run doctor          report
 *   pnpm run doctor --fix    report, and repair what can be repaired
 *
 * Exit code is 1 if anything is still wrong after fixing. That is what the
 * pre-push hook and CI read.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
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
	docsPath,
	generatedApiRegion,
	hasDemo,
	readRegistry,
	renderApiSection,
	sourcePath,
	survey,
	withGeneratedApi,
} from "./docs.mjs";
import {
	GLYPH_OUTPUT,
	GLYPH_SOURCE,
	readGlyphs,
	renderIconComponent,
} from "./glyphs.mjs";
import { loadTemplate, writeFrom } from "./templates.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shouldFix = process.argv.includes("--fix");

/*
 * `--drift` runs the subset where two things that must agree have stopped
 * agreeing: the four DocumentKind declarations, the two intent maps, the
 * comments that name files, and the dependency graph.
 *
 * It exists because those are the failures worth catching *as they are made*
 * rather than at the gate, and the full run is fifty checks - too slow and far
 * too noisy to sit behind every edit. This subset is the part where being told
 * a minute later is the difference between a one-line fix and an archaeology
 * session.
 */
const driftOnly = process.argv.includes("--drift");

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

/*
 * ── atoms, which is an entry plus its chapters ──────────────────────────
 *
 * `atoms.css` is a layer statement and then nothing but imports. Every check
 * below wants the whole cascade, so they follow the import list and work on
 * the concatenation.
 *
 * The import list, not a directory listing, and the difference is load-
 * bearing: `checkBlocksAreEarned` resolves a declaration to the *first* rule
 * that provides it, which is only right while utilities are read before the
 * blocks that might restate them. Sorted filenames would put `blocks/` first
 * and quietly reassign every utility.
 */
const ATOMS_ENTRY = "packages/atoms/src/atoms.css";
const ATOMS_IMPORT = /^@import\s+"\.\/([^"]+)"(?:\s+layer\((\w+)\))?;/gm;

/** The chapters, in cascade order, each with the layer it lands in. */
function atomsFiles() {
	return [...read(ATOMS_ENTRY).matchAll(ATOMS_IMPORT)].map(
		([, file, layer]) => ({
			path: `packages/atoms/src/${file}`,
			css: read(`packages/atoms/src/${file}`),
			/* Set only when the import assigns the layer, as devices.css does. */
			assignedLayer: layer ?? undefined,
		}),
	);
}

/**
 * Every atoms chapter concatenated, with a way back to the file a line is in.
 */
function readAtoms() {
	const files = atomsFiles();
	const parts = [];
	const spans = [];
	let start = 0;

	for (const file of files) {
		/*
		 * A file imported with `layer(x)` carries no wrapper of its own - the
		 * import is what assigns it. Wrap it here so the concatenation has one
		 * shape, and the unlayered-rule check does not read a generated file as
		 * a leak of the very thing it is checking for.
		 */
		const text = file.assignedLayer
			? `@layer ${file.assignedLayer} {\n${file.css}}\n`
			: file.css;
		const height = text.split("\n").length - 1;

		spans.push({
			path: file.path,
			start,
			height,
			wrapped: Boolean(file.assignedLayer),
		});
		parts.push(text);
		start += height;
	}

	const css = parts.join("");

	/** A line index in the concatenation, as `path:line` in its own file. */
	function locate(index) {
		const span = spans.find((s) => index < s.start + s.height) ?? spans.at(-1);
		if (!span) return ATOMS_ENTRY;
		// The wrapper added above is not a line of the file it wraps.
		const line = index - span.start + (span.wrapped ? 0 : 1);
		return `${span.path}:${Math.max(line, 1)}`;
	}

	/** Which chapter contains a snippet, for a report that has no line. */
	function whichFile(needle) {
		return files.find((file) => file.css.includes(needle))?.path ?? ATOMS_ENTRY;
	}

	return { css, files, locate, whichFile };
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
let tracked;

function trackedFiles() {
	/*
	 * Read once. Twenty-three checks ask for this list and the answer cannot
	 * change while the process runs, so each of them was paying for its own
	 * `git ls-files` plus a `statSync` per file - which a profile put at most
	 * of the doctor's runtime, ahead of every check that was doing real work.
	 * Caching it is the whole difference between "the doctor is slow" and "the
	 * doctor spawns git twenty-three times".
	 */
	if (tracked) return tracked;

	const listed = execFileSync(
		"git",
		["ls-files", "--cached", "--others", "--exclude-standard"],
		{ cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
	).split("\n");

	tracked = [...new Set(listed)].filter((path) => path && exists(path));
	return tracked;
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
			"pnpm run doctor --fix",
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

/**
 * Every package says what it may be used under.
 *
 * A manifest with no `license` is not neutral: with no licence granted, the
 * default is all rights reserved, so an "installable" package is one nobody
 * may legally install. Five of these shipped that way while the site told
 * every reader to `pnpm add` them, which is the kind of mistake that is
 * invisible in a diff and total in effect.
 *
 * The root `LICENSE` is checked here too, because a per-package `"MIT"` with
 * no licence text anywhere names a licence rather than granting one.
 */
function checkLicences(list) {
	if (!exists("LICENSE")) {
		report(
			"licence",
			"LICENSE",
			"no licence file at the repo root",
			"without one the default is all rights reserved, and nothing here may be used",
		);
	}

	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		/* Private workspaces are never published, so they grant nothing. */
		if (manifest.private) continue;
		if (manifest.license) continue;

		report(
			"licence",
			`${workspace}/package.json`,
			"no `license` field",
			'add `"license": "MIT"` - a published package with no licence may not be used',
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
 * A script nothing runs is a check nobody is getting.
 *
 * `checkTypecheckHasConfig` above asserts one direction - a typecheck script
 * needs a tsconfig - and the hole was the other one. `product-viewer` and
 * `react-product-viewer` each had a tsconfig, a `tsc --noEmit`, and no way for
 * it to run: the script was called `test:types`, turbo's task is `typecheck`,
 * and turbo only runs what it has a task for. Two packages went unchecked for
 * their whole life. They happened to pass when finally run, which is the worst
 * outcome - nothing would have announced it if they had not.
 *
 * So two assertions, and the second is the general form of the first:
 *
 *   - a workspace that compiles has a `typecheck` script
 *   - every workspace script is either a turbo task or named here with a
 *     reason, because those are the only two ways a script gets run at all
 *
 * The allowlist is the point. A script outside it is not necessarily wrong; it
 * is unaccounted for, which is the state `test:types` was in.
 */
const SCRIPTS_OUTSIDE_TURBO = {
	start: "the deploy's entry point - Railway runs it, not the gate",
	"db:generate": "writes migrations from the schema, by hand and on purpose",
	"db:migrate": "changes a production database; caching one would be a bug",
	"db:studio": "opens a browser and waits, so it is not a task with an end",
};

function checkEveryScriptIsRun(list) {
	const turbo = readJson("turbo.json");
	const tasks = new Set(
		Object.keys(turbo.tasks ?? {}).map((one) => one.replace(/^\/\/#/, "")),
	);

	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		const scripts = manifest.scripts ?? {};

		if (exists(`${workspace}/tsconfig.json`) && !scripts.typecheck) {
			report(
				"scripts",
				workspace,
				"has a tsconfig.json and no `typecheck` script, so nothing typechecks it",
				'add `"typecheck": "tsc --noEmit"`; turbo runs the task, not the file',
			);
		}

		for (const name of Object.keys(scripts)) {
			if (tasks.has(name)) continue;
			if (name in SCRIPTS_OUTSIDE_TURBO) continue;

			report(
				"scripts",
				`${workspace}/package.json`,
				`\`${name}\` is not a turbo task, so nothing ever runs it`,
				"rename it to the task it belongs to, or name it in SCRIPTS_OUTSIDE_TURBO with why",
			);
		}
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

/**
 * The push gate stays a delegation.
 *
 * `.husky/pre-push` runs `pnpm run check` and nothing else, so the hook, CI
 * and a human typing `pnpm check` all run the same list and none of them can
 * drift. The hook once carried its own copy of the steps; the copies were
 * identical the day they were written and nothing kept them that way.
 *
 * `prepare` is what installs the hook on a fresh clone, so a prepare script
 * that stopped running husky is a machine whose pushes skip the gate without
 * anyone choosing to skip it.
 */
function checkPushGateDelegates() {
	const hookPath = ".husky/pre-push";
	if (!exists(hookPath)) {
		report(
			"push-gate",
			hookPath,
			"missing - pushes leave this machine unchecked",
			"pnpm run doctor --fix",
		);
		if (shouldFix) {
			writeFileSync(join(root, hookPath), "#!/bin/sh\npnpm run check:fast\n", {
				mode: 0o755,
			});
			repaired(`${hookPath}: recreated as a delegation to pnpm run check:fast`);
		}
	} else {
		const hook = read(hookPath);
		const commands = hook
			.split("\n")
			.filter((line) => line.trim() && !line.trim().startsWith("#"));
		const delegates =
			commands.length === 1 && commands[0].trim() === "pnpm run check:fast";
		if (!delegates) {
			report(
				"push-gate",
				hookPath,
				"carries its own command list instead of delegating to `pnpm run check:fast` - a second copy of the gate is a copy that drifts",
				"make the hook body exactly `pnpm run check:fast`",
			);
		}
	}

	const prepare = readJson("package.json").scripts?.prepare ?? "";
	if (!prepare.includes("husky")) {
		report(
			"push-gate",
			"package.json",
			`prepare script is "${prepare}" - a fresh clone never installs the pre-push hook`,
			'scripts.prepare: "husky || true"',
		);
	}
}

/* ── the component pipeline ──────────────────────────────────────────── */

/**
 * Every element names a real schema.org class.
 *
 * The registry cannot import the vocabulary - `packages/ui` has no
 * dependencies and is not taking one for a string - so the check lives here
 * instead, reading the generated module by path. That is the trade: the field
 * is a plain string in the package, and a class that schema.org does not
 * publish fails at the gate rather than shipping as JSON-LD nothing parses.
 */
function checkElementsDeclareSchemaType(items) {
	const generated = read("packages/db/src/schema-org.generated.ts");
	const listed = generated.match(
		/export const SCHEMA_TYPES = (\[[\s\S]*?\]) as const;/,
	)?.[1];

	if (!listed) {
		report(
			"schema",
			"packages/db/src/schema-org.generated.ts",
			"cannot read SCHEMA_TYPES",
			"regenerate it: pnpm run schema-org",
		);
		return;
	}

	/*
	 * Read the strings out rather than parsing the array as JSON. The formatter
	 * rewrites the generated file across many lines with a trailing comma,
	 * which is valid TypeScript and not valid JSON - so `JSON.parse` here fails
	 * on a file that is perfectly correct, and did.
	 */
	const types = new Set(
		[...listed.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
	);

	for (const item of items) {
		if (!item.schema) {
			report(
				"schema",
				"packages/ui/registry.ts",
				`${item.name} declares no schema.org type`,
				'add `schema: "SoftwareSourceCode"` or the class it actually expresses',
			);
			continue;
		}

		if (!types.has(item.schema)) {
			report(
				"schema",
				"packages/ui/registry.ts",
				`${item.name} claims schema.org type ${item.schema}, which does not exist`,
				`check the spelling at https://schema.org/${item.schema}`,
			);
		}
	}
}

function checkRegistryFilesExist(items) {
	for (const item of items) {
		for (const file of item.files) {
			if (exists(sourcePath(item, file))) continue;

			report(
				"registry",
				`packages/ui/registry.ts`,
				`"${item.name}" lists ${file}, which does not exist - installing it copies nothing`,
			);
		}
	}
}

/**
 * Every declared variant is a value a prop actually accepts.
 *
 * A variant list is read by three surfaces that cannot check it - the
 * component page, the MCP server and the registry endpoints - so a value that
 * no prop takes is a value all three advertise and none can deliver. The
 * failure is somebody copying it out of documentation and getting a type
 * error, or worse, a `string` prop that silently accepts it and does nothing.
 *
 * The check is textual rather than a type read: the source is TypeScript and
 * this script is plain Node with nothing between it and the filesystem, which
 * is the trade the pipeline document describes. So it looks for the value in
 * the file's props - inside a union, or as a boolean when the declared value
 * is `true` - and reports what it could not find.
 *
 * That means it can miss a variant whose prop is typed through an alias. It
 * cannot report one that is simply invented, which is the failure worth
 * catching and the one that actually happened.
 */
function checkRegistryVariantsExist(items) {
	for (const item of items) {
		if (!item.variants?.length) continue;

		const source = item.files
			.map((file) => read(sourcePath(item, file)) ?? "")
			.join("\n");

		if (!source) continue;

		for (const variant of item.variants) {
			if (!new RegExp(`\\b${variant.prop}\\??:`).test(source)) {
				report(
					"variants",
					"packages/ui/registry.ts",
					`"${item.name}" declares a ${variant.prop} variant, and no prop called ${variant.prop} exists`,
					"remove it from `variants`, or add the prop",
				);
				continue;
			}

			// `true` is a boolean prop's only interesting value, and a boolean is
			// not written as a quoted union - so its presence is all there is to
			// check once the prop itself has been found.
			if (variant.value === "true") continue;

			if (!source.includes(`"${variant.value}"`)) {
				report(
					"variants",
					"packages/ui/registry.ts",
					`"${item.name}" declares ${variant.prop}="${variant.value}", which does not appear in ${item.files.join(", ")}`,
					"a variant has to be a value the prop takes",
				);
			}
		}

		const defaults = new Map();
		for (const variant of item.variants) {
			if (!variant.default) continue;
			if (defaults.has(variant.prop)) {
				report(
					"variants",
					"packages/ui/registry.ts",
					`"${item.name}" marks two defaults for ${variant.prop}`,
					"a prop has one value you get by leaving it off",
				);
			}
			defaults.set(variant.prop, variant.value);
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

/**
 * A file people install has to be importable from the package too.
 *
 * From *its own* package, which is the part that was assumed. This read
 * `packages/ui/src/index.ts` for every item, so registering the 3D viewer -
 * which lives in `react-product-viewer` and is exported from that barrel -
 * demanded an export from `ui` that would have been a lie and a dependency.
 *
 * A file can also be re-exported through a directory barrel rather than named
 * directly, which is how the packages outside `ui` are arranged: `ui/src` is
 * flat by convention and nothing else has to be. So the check is "the barrel
 * mentions this file's directory or its stem", which is the weakest claim that
 * still catches the failure it was written for - a file shipped in the
 * registry that no consumer can import.
 */
/**
 * One walk of the repository, looking for the same thing in two places.
 *
 * Every other check asks whether one thing is right. This asks whether two
 * things are the same thing twice, which is the failure that never errors:
 * duplicates do not crash, they mean an edit lands on the copy nobody reads.
 *
 * Four kinds, and every one of them has actually happened here:
 *
 *   a slug documented by two packages   the glob picks one, silently
 *   a registry name used twice          the second entry wins, silently
 *   a file shipped by two peers         installing either drags the other
 *   a collection filtering on a kind    a page that renders a heading and
 *   no document has                     nothing, forever
 *
 * One walk reporting all four, because a walker that has to be run four times
 * is four commands somebody runs three of.
 */
/**
 * Every subcategory and tag an item uses is one the taxonomy declares.
 *
 * `category` has always been a union, so a wrong one is a compile error.
 * `subcategory` and `tags` were free strings, and the cost of that only shows
 * up when you count: eighty-nine distinct tags across seventy-odd items,
 * fifty-nine of them used exactly once, and two pairs that are the same
 * concept spelled twice - `filter`/`filtering`, `heading`/`headings`.
 *
 * A tag that exists under two spellings is worse than a missing one. The
 * filter still works, still returns rows, and silently returns half of them.
 * Nothing errors and nothing looks wrong.
 *
 * Checked here rather than typed as a union in `registry.ts`, because a union
 * of twenty-two strings would be the vocabulary written twice - and this can
 * say which value is wrong and what the alternatives are, where a compiler
 * says only that an assignment failed.
 */
function checkTaxonomyIsDeclared(items) {
	const taxonomy = read("packages/ui/taxonomy.ts");

	const subcategories = new Set(
		[...taxonomy.matchAll(/\n\t\tname: "([^"]+)",\n\t\tcategory:/g)].map(
			([, name]) => name,
		),
	);
	/*
	 * Across lines or on one, because the formatter decides which. The first
	 * pattern only matched the tight form and found eighty-one of eighty-eight
	 * - so seven declared tags read as undeclared, and the check reported real
	 * items for using words that were right there in the file.
	 */
	const tags = new Set(
		[...taxonomy.matchAll(/name: "([^"]+)",\s*about:/g)].map(
			([, name]) => name,
		),
	);

	/*
	 * A parser that finds nothing must not silently pass everything. This has
	 * happened twice in this file today - a check whose source of truth was the
	 * wrong shape reported every collection as broken, and a variants check
	 * passed vacuously because the registry reader did not parse the field.
	 */
	if (subcategories.size === 0 || tags.size === 0) {
		report(
			"taxonomy",
			"packages/ui/taxonomy.ts",
			`read ${subcategories.size} subcategories and ${tags.size} tags - the parser found nothing, so nothing below was checked`,
			"the shape of taxonomy.ts changed; fix the patterns in checkTaxonomyIsDeclared",
		);
		return;
	}

	for (const item of items) {
		if (item.subcategory && !subcategories.has(item.subcategory)) {
			report(
				"taxonomy",
				"packages/ui/registry.ts",
				`"${item.name}" uses subcategory "${item.subcategory}", which taxonomy.ts does not declare`,
				"add it to SUBCATEGORIES, or use one that is there",
			);
		}

		for (const tag of item.tags ?? []) {
			if (tags.has(tag)) continue;

			report(
				"taxonomy",
				"packages/ui/registry.ts",
				`"${item.name}" uses tag "${tag}", which taxonomy.ts does not declare`,
				"add it to TAGS with a sentence saying what it claims, or use an existing one",
			);
		}
	}
}

function checkNothingIsDuplicated(items) {
	/* ── one slug, one package ─────────────────────────────────── */
	const docOwners = new Map();

	for (const pkg of readdirSync(join(root, "packages"))) {
		if (!exists(`packages/${pkg}/docs`)) continue;

		for (const slug of readdirSync(join(root, "packages", pkg, "docs"))) {
			const seen = docOwners.get(slug);

			if (seen && seen !== pkg) {
				report(
					"duplicates",
					`packages/${pkg}/docs/${slug}`,
					`${slug} is also documented in packages/${seen} - one slug is one page, and the glob picks one of them`,
					"delete the copy that is not the source, or rename one of the slugs",
				);
				continue;
			}
			docOwners.set(slug, pkg);
		}
	}

	/* ── one name, one item ────────────────────────────────────── */
	const byName = new Map();

	for (const item of items) {
		if (byName.has(item.name)) {
			report(
				"duplicates",
				"packages/ui/registry.ts",
				`two items are called "${item.name}" - the later wins and the earlier is unreachable`,
				"rename one of them",
			);
		}
		byName.set(item.name, item);
	}

	/*
	 * ── one file, one owner ───────────────────────────────────────
	 *
	 * Shared files are legitimate and common: `folder-shelf` ships
	 * `context-menu.tsx` because installing the shelf without it is a broken
	 * shelf. What is not legitimate is two *peers* both claiming a file with
	 * neither depending on the other - then installing either quietly brings
	 * the other's source along and nothing declared it.
	 */
	const fileOwners = new Map();

	for (const item of items) {
		for (const file of item.files) {
			const key = `${item.package ?? "ui"}/${file}`;
			const first = fileOwners.get(key);

			if (first) {
				const related =
					(first.registryDependencies ?? []).includes(item.name) ||
					(item.registryDependencies ?? []).includes(first.name);

				if (!related) {
					report(
						"duplicates",
						"packages/ui/registry.ts",
						`"${item.name}" and "${first.name}" both ship ${file}, and neither depends on the other`,
						"list one as a registryDependency of the other, so the sharing is declared",
					);
				}
				continue;
			}
			fileOwners.set(key, item);
		}
	}

	/*
	 * ── a collection filtering on a kind that does not exist ──────
	 *
	 * Checked against the `DocumentKind` union in the schema rather than
	 * against what is currently indexed, and the difference matters twice.
	 *
	 * A typo is always wrong: `kind: skil` can never match anything, whatever
	 * the database holds. A legal kind with no rows today is a much weaker
	 * claim - it might mean the collection is premature, and it certainly
	 * means the projection is stale, which is not this script's business.
	 *
	 * The first version read `survey()`, which describes component
	 * documentation and has no `kind` field at all - so the set was empty and
	 * every collection in the repository was reported as broken. A check whose
	 * source of truth is the wrong shape does not fail; it condemns everything.
	 */
	const kinds = new Set(
		[...read("packages/db/src/schema.ts").matchAll(/^\t\| "(\w+)";?$/gm)].map(
			([, kind]) => kind,
		),
	);
	const collections = "apps/web/content/collections";

	if (exists(collections)) {
		for (const file of readdirSync(join(root, collections))) {
			if (!file.endsWith(".md")) continue;

			const wanted = read(`${collections}/${file}`).match(
				/^kind:\s*(\S+)$/m,
			)?.[1];

			if (wanted && kinds.size > 0 && !kinds.has(wanted)) {
				report(
					"duplicates",
					`${collections}/${file}`,
					`filters on kind "${wanted}", which is not a DocumentKind - it can never match anything`,
					`one of: ${[...kinds].join(", ")}`,
				);
			}
		}
	}
}

function checkRegistryFilesAreExported(items) {
	const barrels = new Map();

	for (const item of items) {
		const pkg = item.package ?? "ui";
		const path = `packages/${pkg}/src/index.ts`;
		if (!barrels.has(pkg)) barrels.set(pkg, exists(path) ? read(path) : "");
		const barrel = barrels.get(pkg);

		for (const file of item.files) {
			const stem = file.replace(/\.tsx?$/, "");
			const directory = stem.includes("/")
				? stem.slice(0, stem.lastIndexOf("/"))
				: null;

			if (barrel.includes(`./${stem}`)) continue;
			if (directory && barrel.includes(`./${directory}`)) continue;

			report(
				"exports",
				path,
				`${file} ships in the registry but is not exported from ${pkg}`,
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
	/*
	 * Per chapter rather than over the concatenation, so the report names the
	 * file to open. A chapter imported with `layer()` is exempt: the import
	 * assigns its layer, so its own top level is bare by design.
	 */
	for (const file of [{ path: ATOMS_ENTRY, css: read(ATOMS_ENTRY) }].concat(
		atomsFiles().filter((file) => !file.assignedLayer),
	)) {
		const source = file.css.replace(/\/\*[\s\S]*?\*\//g, "");

		let depth = 0;
		let buffer = "";
		for (const char of source) {
			if (char === "{") {
				if (depth === 0) {
					const prelude = buffer.trim();
					if (!prelude.startsWith("@layer")) {
						report(
							"layers",
							file.path,
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
							file.path,
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
	const atoms = readAtoms();
	const source = atoms.css.replace(/\/\*[\s\S]*?\*\//g, "");

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
			atoms.whichFile(rule),
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
	/*
	 * Only what somebody copies.
	 *
	 * The check exists because a pasted file whose sibling import was not
	 * pasted too is an install that fails to resolve - which is a real and
	 * silent failure, and the reason every relative import has to be in some
	 * item's `files`.
	 *
	 * None of that applies to an item that arrives through a package manager.
	 * Its imports resolve from the installed package, and demanding they be
	 * listed would mean enumerating a package's whole internal graph in a
	 * registry entry to describe one component.
	 */
	items = items.filter((item) => (item.install ?? "copy") === "copy");

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
			const source = read(sourcePath(item, file));

			for (const [, stem] of source.matchAll(
				/import\s[^;]*?from\s+"\.\/([\w.-]+)"/g,
			)) {
				if (own.has(stem)) continue;

				const holders = owners.get(stem);

				/*
				 * No item ships this file at all - the worst case, and the one
				 * this check used to skip. folder-shelf imported a hook that
				 * lived in no item's files, every install of it broke on the
				 * first line, and this loop walked straight past because there
				 * was no owner to compare against.
				 */
				if (!holders) {
					report(
						"registry",
						sourcePath(item, file),
						`imports ./${stem}, which no registry item ships - every install of "${item.name}" fails to resolve it`,
						`add "${stem}.ts(x)" to an item's files - its own, or a new item's`,
					);
					continue;
				}

				if ([...holders].some((name) => declared.has(name))) continue;

				const [suggestion] = holders;
				report(
					"registry",
					sourcePath(item, file),
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
		if (exists(docsPath(item, "index.md"))) continue;

		if (shouldFix) {
			await writeFrom("component-index", docsPath(item, "index.md"), {
				slug: item.name,
				title: item.title,
			});
			repaired(docsPath(item, "index.md"));
			continue;
		}

		report(
			"docs",
			`${docsPath(item)}/`,
			"no index.md - the component page falls back to its registry blurb",
			"pnpm run doctor --fix",
		);
	}
}

/**
 * A demo is the difference between a card that shows the component and a card
 * that shows a placeholder. Not fixable: a demo is JSX somebody has to mean.
 */
function checkRegistryItemsHaveDemos(items) {
	for (const item of items) {
		if (hasDemo(item.name)) continue;

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
	const atoms = readAtoms().css;

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
		"pnpm run doctor --fix. Edit the table, never the component",
	);
}

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

/**
 * The site's own address is written once.
 *
 * `SITE.url` exists and eleven files ignored it, hardcoding the origin into
 * install commands, breadcrumb JSON-LD and prompt URLs. Moving the site to
 * `adamjurek.com` meant finding all eleven, and the ones in Markdown could not
 * be found by the type checker at all.
 *
 * Markdown is exempt: a content file cannot import a constant, so the literal
 * is the only thing it can carry. Everything that compiles has no excuse.
 */
function checkOriginIsWrittenOnce() {
	const home = "apps/web/src/modules/content/site.catalogue.ts";

	for (const path of trackedFiles()) {
		if (path === home) continue;
		if (!/^apps\/web\/(src|tests)\/.*\.tsx?$/.test(path)) continue;

		const found = read(path).match(
			/https:\/\/[a-z0-9.-]*(?:adamjurek|sushindustries)\.com/,
		);
		if (!found) continue;

		report(
			"origin",
			path,
			`hardcodes ${found[0]} instead of reading it from SITE`,
			"import { SITE } from the site catalogue and interpolate SITE.url",
		);
	}
}

/**
 * Every API tab matches the source it documents.
 *
 * The Props table is generated - names, types, defaults and the JSDoc line all
 * come out of the interface - so a table that no longer matches is a table that
 * lies, and a prop table that lies is worse than none: a reader trusts it.
 *
 * It found drift the day it was written. Of the three hand-maintained `api.md`
 * files in the repo, two were already wrong: `doc-aside` never documented
 * `footer` (which this site passes) and `video-player` never documented
 * `theme`.
 *
 * This is the one place where editing the Markdown is the wrong move. The
 * `Does` column is the JSDoc on the prop, so a better sentence goes in the
 * interface - where it also reaches every consumer's editor - and comes back
 * here through `--fix`.
 */
/**
 * Every doc section carries the shape its tab promises.
 *
 * The tabs exist so a component page is not one long file: Home says what it
 * is and shows it, Get Started gets it rendering, Guides is for what is true
 * after it works, API is the props, Examples is it doing a job. When four of
 * the five went unwritten, Home became the manual - a median of 140 words, and
 * a worst case of 2,177.
 *
 * So the rules are about shape rather than length. A Home tab over budget is
 * not too long, it is carrying another tab, and the fix is `pnpm new docs
 * <slug> guides` and moving whole sections into it. A heading with nothing to
 * copy under it and a page of prose is the one this repo calls a life story.
 *
 * The contract itself lives in `scripts/docs.mjs`, so the report and this
 * check cannot disagree about what is wrong.
 */
function checkDocsFollowTheContract() {
	for (const row of survey(readRegistry())) {
		for (const finding of row.findings) {
			/*
			 * Empty summaries are `checkDocsHaveSummaries`, which can repair them.
			 * Reporting the same file twice under two names is how a list of
			 * problems becomes a list nobody reads.
			 */
			if (finding.rule === "frontmatter") continue;
			/* API drift is `checkApiDocsMatchSource`, which regenerates it. */
			if (finding.rule === "api-drift") continue;

			report("contract", finding.path, finding.message, finding.hint);
		}
	}
}

/**
 * Every documented element has a summary, because forty-three did not.
 *
 * `summary:` is the meta description, the line in `llms.txt`, and the sentence
 * under the heading on the page. `templates/component-index.md` scaffolds it
 * blank, so it shipped blank - which `component-page.ts` already works around
 * by falling back to the registry description at render time.
 *
 * If the fallback is the right sentence, it is the right sentence to write
 * down. Fixable for exactly that reason: this copies a sentence that exists
 * rather than inventing one, so it is not the scaffolded "TODO" this repo
 * refuses. An element with no registry entry has nothing to copy, and is
 * reported instead.
 */
function checkDocsHaveSummaries(items) {
	const descriptions = new Map(
		items.map((item) => [item.name, item.description]),
	);

	for (const path of trackedFiles()) {
		const slug = /^packages\/[^/]+\/docs\/([\w-]+)\/index\.md$/.exec(path)?.[1];
		if (!slug) continue;

		const body = read(path);
		const value = /^summary:(.*)$/m.exec(body)?.[1];
		if (value === undefined || value.trim()) continue;

		const description = descriptions.get(slug);

		if (description && shouldFix) {
			writeFileSync(
				join(root, path),
				body.replace(/^summary:.*$/m, `summary: ${description}`),
			);
			repaired(`${path}: summary from the registry description`);
			continue;
		}

		report(
			"frontmatter",
			path,
			"`summary:` is empty, so the page ships with no meta description",
			description
				? "pnpm run doctor --fix copies the registry description"
				: "no registry entry to copy from - write one sentence",
		);
	}
}

async function checkApiDocsMatchSource(items) {
	for (const item of items) {
		const path = docsPath(item, "api.md");
		if (!exists(path)) continue;

		const expected = renderApiSection(sourcePath(item, item.files[0]));
		if (!expected) continue;

		const body = read(path);
		const found = generatedApiRegion(body);

		/*
		 * A file with no fence is never rewritten, only reported.
		 *
		 * Without the markers there is nothing that says where somebody's
		 * writing begins, and a repair that guesses is a repair that deletes.
		 * This one did: it took `### revolutions`, `### tilt` and a callout out
		 * of `scroll-spin/api.md` because they sat under the table it was
		 * replacing. Adding the fence is a decision about someone else's file,
		 * so it is left to them.
		 */
		if (found === undefined) {
			report(
				"docs",
				path,
				"no `<!-- generated:api -->` fence, so the props table is maintained by hand and will drift",
				"wrap the generated section in the fence, then pnpm run doctor --fix keeps it current",
			);
			continue;
		}

		if (found === expected.trim()) continue;

		if (shouldFix) {
			/*
			 * Spliced between the markers by position. Everything outside them is
			 * untouched, and an empty region is filled rather than prepended to -
			 * which `String.replace` cannot promise, because replacing "" inserts
			 * at index zero.
			 */
			writeFileSync(join(root, path), withGeneratedApi(body, expected));
			repaired(`${path}: API section regenerated from the source`);
			continue;
		}

		report(
			"docs",
			path,
			"the API section no longer matches the source",
			"pnpm run doctor --fix - and to change a description, edit the JSDoc",
		);
	}
}

/**
 * Every desktop icon label fits the tile it is drawn in.
 *
 * A desk icon is a tile six to nine characters wide, and its label is the only
 * field an author writes freely - the glyph comes from a table, the href from a
 * route, the kind from a file extension. So it is the only one that can be
 * wrong in a way nothing catches.
 *
 * It was wrong for months. The packages folder labelled every icon with the
 * full scoped name, and `@sushindustries/react-product-viewer` is thirty-six
 * characters with no space in it, so it could not wrap: measured at 148px in a
 * 108px tile, overlapping its neighbour by 26 pixels. The stylesheet keeps a
 * label inside its tile now whatever it says, but a name broken across four
 * lines is still a name nobody reads.
 *
 * The limits are read out of `shelf.schemas.ts` rather than restated, so the
 * number the doctor enforces and the number the renderer validates are the same
 * number. Same arrangement as `SECTION_ORDER`.
 */
function checkDeskLabelsFit() {
	const schema = "apps/web/src/modules/chrome/shelf.schemas.ts";
	if (!exists(schema)) return;

	const source = read(schema);
	const limit = Number(/MAX_LABEL = (\d+)/.exec(source)?.[1]);
	const noteLimit = Number(/MAX_DESCRIPTION = (\d+)/.exec(source)?.[1]);
	if (!limit) return;

	/* `- [Label](/href)` or `- name.app`, then an optional ` - description`. */
	const line =
		/^\s*-\s+(?:\[([^\]]+)\]\([^)]*\)|([\w-]+)\.(?:app|folder))(?:\s+`[^`]+`)?(?:\s+-\s+(.+?))?\s*$/;

	for (const path of trackedFiles()) {
		if (!/^apps\/web\/content\/(desks\/[\w-]+|shelf)\.md$/.test(path)) continue;

		const body = read(path);

		/*
		 * Only the list, never the prose above it. These files document their
		 * own format with a fenced example of the shape being parsed, and a
		 * check that read the whole file would report the documentation.
		 */
		const at = Math.max(
			body.indexOf("## The desk"),
			body.indexOf("## The shelf"),
		);
		if (at < 0) continue;

		const lines = body.slice(at).split("\n");

		for (const [index, text] of lines.entries()) {
			const match = line.exec(text);
			if (!match) continue;

			const [, linkLabel, name, description] = match;
			const label =
				linkLabel ?? (name ? name[0].toUpperCase() + name.slice(1) : "");
			const where = `${path}:${body.slice(0, at).split("\n").length + index}`;

			if (label.length > limit) {
				report(
					"desk",
					where,
					`"${label}" is ${label.length} characters and a desktop icon holds ${limit}`,
					"use the short name - the page it opens carries the full one",
				);
			}

			if (description && noteLimit && description.length > noteLimit) {
				report(
					"desk",
					where,
					`the note under "${label}" is ${description.length} characters (limit ${noteLimit})`,
				);
			}
		}
	}
}

/**
 * Every docs file is at the depth the catalogue globs.
 *
 * The other half of the same failure, and the half the check above cannot see:
 * its pattern requires `docs/<slug>/<section>.md`, so a file sitting one level
 * shallower matches neither the check nor the glob, and is invisible to both.
 *
 * packages/assistant/docs/index.md was 208 lines written that way. Nothing
 * failed, nothing warned, and the page it should have been simply did not
 * exist. The slug comes from the *directory*, so a doc without one has no
 * address for a page to live at.
 */
function checkDocsAreAddressable() {
	for (const path of trackedFiles()) {
		const match = /^packages\/[^/]+\/docs\/([\w-]+)\.md$/.exec(path);
		if (!match) continue;

		report(
			"docs",
			path,
			"sits directly in docs/, so nothing globs it and it renders on no page",
			`move it to docs/${match[1]}/index.md - the directory is the slug`,
		);
	}
}

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
			"pnpm run doctor --fix. Edit the table, never the output",
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
	const atoms = readAtoms();
	const lines = atoms.css.split("\n");

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
			atoms.locate(index),
			`literal colour \`${line.trim()}\``,
			"add it to :root and reference the token, so the palette stays one edit wide",
		);
	}
}

/**
 * Every custom property a rule reads is one some rule writes.
 *
 * `var(--r-sm)` with nothing defining `--r-sm` is not an error anywhere. The
 * declaration is dropped, the corner renders square, and it looks deliberate.
 * Three rules were doing exactly that, and `questions.css` shipped with no
 * text colour and no border for the same reason - the feature looked finished
 * because the fallback for "no value" is "the value it already had".
 *
 * A reference with a fallback - `var(--grid-min, 16rem)` - is fine by
 * construction: the fallback is the definition for the case where there isn't
 * one. Only bare references have to resolve.
 */
function checkTokensResolve() {
	const atoms = readAtoms();

	/*
	 * Set from JavaScript at runtime, so they are declared nowhere in CSS and
	 * that is correct: a dragged window's position cannot have a stylesheet
	 * value. Each one is written by the component named beside it.
	 */
	const FROM_SCRIPT = new Set([
		"--w", // desk-window, resized
		"--h", // desk-window, resized
		"--x", // desk-window, dragged
		"--y", // desk-window, dragged
		"--video-ratio", // video-player, from the media's own dimensions
		"--i", // typed-mark, a character's position in the word
	]);

	const defined = new Set(
		[...atoms.css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]),
	);

	/* Bare `var(--x)` only: a comma means a fallback follows. */
	for (const match of atoms.css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
		const name = match[1];
		if (defined.has(name) || FROM_SCRIPT.has(name)) continue;

		const line = atoms.css.slice(0, match.index).split("\n").length - 1;
		report(
			"tokens",
			atoms.locate(line),
			`\`var(${name})\` is never defined`,
			"define it in the tokens layer, or give the reference a fallback",
		);
	}
}

/**
 * Depth comes from the ladder, not from a number picked in the moment.
 *
 * The same argument as colour, one axis over. A raw `z-index` is a claim about
 * what this element beats, made without seeing anything it is competing with,
 * and the file had reached `29`, `30` and `31` sitting next to each other
 * before anyone noticed. At that point the numbers are not a scale: nothing
 * says whether 31 beats 30 deliberately or by accident, and inserting a layer
 * between them means renumbering whatever sits above.
 *
 * Tokens turn it back into a question with an answer. `--z-scrim` under
 * `--z-overlay` is an ordering somebody decided once, in one place, where the
 * whole ladder is visible at the same time.
 */
function checkDepthsUseTokens() {
	const atoms = readAtoms();

	let inTokens = false;
	let depth = 0;

	for (const [index, line] of atoms.css.split("\n").entries()) {
		if (line.startsWith("@layer tokens {")) {
			inTokens = true;
			depth = 0;
		}

		/* The tokens layer is where the ladder is written down, so it is exempt. */
		if (inTokens) {
			depth += (line.match(/\{/g) ?? []).length;
			depth -= (line.match(/\}/g) ?? []).length;
			if (depth <= 0 && line.includes("}")) inTokens = false;
			continue;
		}

		/*
		 * `z-index: 0` and `auto` are exempt: neither is a position in the
		 * ladder. Zero creates a stacking context without claiming a rank, and
		 * that is a real thing to want on its own.
		 */
		const match = /z-index:\s*(-?\d+)\s*;/.exec(line);
		if (!match || match[1] === "0") continue;

		report(
			"tokens",
			atoms.locate(index),
			`literal depth \`${line.trim()}\``,
			"use a --z-* token, so the stacking order is decided in one place",
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
	const atoms = readAtoms();
	const css = atoms.css;

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
			atoms.whichFile(name),
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
		/*
		 * Other people's sentences. These shards are each provider's own
		 * published description of their own pages, and this is a house style
		 * rule about prose I write. Worse than out of scope, `--fix` would
		 * silently edit a quotation, which turns an accurate citation into an
		 * inaccurate one - and nothing downstream would ever notice.
		 */
		if (path.startsWith("packages/cli/references/")) continue;

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
		report("style", path, `${count} em dash(es)`, "pnpm run doctor --fix");
	}
}

/*
 * Every media file the README embeds exists and is younger than the limit.
 *
 * `media/` is what the repository looks like on GitHub, and a screenshot is
 * the one artefact nothing else here regenerates: the site can change under
 * it silently. So the check has teeth on both ends - a missing capture fails
 * because the README would render a broken image, and one past ninety days
 * fails because a year-old picture of the home page is a quiet lie. Both
 * have the same repair, and `--fix` runs it: the capture script is a machine
 * and the doctor is allowed to operate machines.
 */
const MEDIA_MAX_AGE_DAYS = 90;

function checkReadmeMedia() {
	const readme = read("README.md");
	const embeds = [...readme.matchAll(/(?:src="|\]\()(media\/[\w.-]+)/g)].map(
		(hit) => hit[1],
	);

	/*
	 * Only what `pnpm media` actually produces ages out - the home and
	 * components screenshots. A static brand asset (the funding button,
	 * a logo) has no capture to go stale: nothing regenerates it, so ninety
	 * days flagging it would be a finding `--fix` could never resolve.
	 */
	const isScreenshot = (path) =>
		/^media\/(home|components)-(light|dark)\.webp$/.test(path);

	const stale = (path) => {
		const file = join(root, path);
		if (!existsSync(file)) return "embedded in README.md but missing";
		if (!isScreenshot(path)) return undefined;
		const days = (Date.now() - statSync(file).mtimeMs) / 86_400_000;
		if (days > MEDIA_MAX_AGE_DAYS) {
			return `${Math.floor(days)} days old, limit is ${MEDIA_MAX_AGE_DAYS}`;
		}
		return undefined;
	};

	let broken = [...new Set(embeds)]
		.map((path) => [path, stale(path)])
		.filter(([, why]) => why);

	if (broken.length > 0 && shouldFix) {
		try {
			execFileSync(process.execPath, [join(root, "scripts/media.mjs")], {
				stdio: "inherit",
			});
			repaired("media/: captures retaken");
			broken = broken.filter(([path]) => stale(path));
		} catch {
			// The capture failing is itself the finding; fall through and report.
		}
	}

	for (const [path, why] of broken) {
		report("media", path, why, "pnpm media");
	}
}

/*
 * The component archive's screenshots, held to the source they were taken
 * from rather than to a clock.
 *
 * `pnpm shots` writes `manifest.json` with a hash of `demos.tsx` and
 * `demo-sources.ts` next to the captures - the two files a demo's appearance
 * can come from. This recomputes that hash and compares: a mismatch means a
 * demo changed after the picture of it was taken, which is a component page
 * showing a screenshot of a component that no longer looks like that.
 */
function checkShotsAreFresh() {
	const manifestPath = join(root, "apps/web/public/shots/manifest.json");

	if (!existsSync(manifestPath)) {
		if (shouldFix) return runShots("shots/: never captured");
		report("shots", "apps/web/public/shots/", "never captured", "pnpm shots");
		return;
	}

	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	const currentHash = createHash("sha256")
		.update(read("apps/web/src/modules/showcase/demos.tsx"))
		.update(read("apps/web/src/modules/showcase/demo-sources.ts"))
		.digest("hex");

	if (currentHash === manifest.sourceHash) return;

	if (shouldFix) {
		runShots("shots/: demo source changed since capture");
		return;
	}

	report(
		"shots",
		"apps/web/public/shots/",
		"demo source changed since capture",
		"pnpm shots",
	);
}

function runShots(reason) {
	try {
		execFileSync(process.execPath, [join(root, "scripts/shots.mjs")], {
			stdio: "inherit",
		});
		repaired(`shots/: recaptured (${reason})`);
	} catch {
		report(
			"shots",
			"apps/web/public/shots/",
			`${reason}, and the recapture failed - run \`pnpm build && pnpm shots\` by hand`,
		);
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
/**
 * The four places `DocumentKind` is written agree with each other.
 *
 * A type cannot be iterated and an array cannot be a column's type, so this
 * one list genuinely has to exist more than once: as a union in the schema, as
 * an array the studio builds a `<select>` from, as a GraphQL enum the CLI
 * generates, and as the classifier the MCP server matches paths with.
 *
 * Two comments in the codebase claimed `documents.schemas.test.ts` asserted
 * they agree. That file has never existed. The lists happened to match, so
 * nothing was wrong yet - but the next person to add a kind would have trusted
 * a guard that was not there, and the failure mode is a filter that silently
 * returns nothing: no error, no empty state, just a kind that appears in the
 * dropdown and matches no rows.
 */
function checkDocumentKindsAgree() {
	const union = [
		...(read("packages/db/src/schema.ts")
			.split("export type DocumentKind =")[1]
			?.split(";")[0]
			?.matchAll(/"([a-z]+)"/g) ?? []),
	].map((match) => match[1]);

	if (union.length === 0) {
		report(
			"kinds",
			"packages/db/src/schema.ts",
			"could not read the DocumentKind union",
			"this check parses it - if the declaration moved, move this with it",
		);
		return;
	}

	const others = [
		{
			path: "apps/web/src/modules/studio/documents/documents.schemas.ts",
			between: ["export const DOCUMENT_KINDS = [", "] as const"],
			pattern: /"([a-z]+)"/g,
		},
		{
			path: "packages/cli/mcp/docs.mjs",
			between: ["const KINDS = [", "\n];"],
			pattern: /kind: "([a-z]+)"/g,
		},
		/*
		 * The fifth copy, and the one that proves the point. This check was
		 * written comparing three declarations and missed the array the GraphQL
		 * generator builds its enum from - so a check against drift had itself
		 * drifted from the thing it checks before it was a day old.
		 */
		{
			path: "packages/cli/commands/graphql.mjs",
			between: ["const kinds = [", "\n\t];"],
			pattern: /"([a-z]+)"/g,
		},
	];

	for (const one of others) {
		const body = read(one.path)
			.split(one.between[0])[1]
			?.split(one.between[1])[0];

		if (body === undefined) {
			report(
				"kinds",
				one.path,
				`could not find ${one.between[0].trim()}`,
				"this check parses it - if the declaration moved, move this with it",
			);
			continue;
		}

		const found = [...body.matchAll(one.pattern)].map((match) => match[1]);

		const missing = union.filter((kind) => !found.includes(kind));
		const extra = found.filter((kind) => !union.includes(kind));

		for (const kind of missing) {
			report(
				"kinds",
				one.path,
				`does not carry "${kind}", which DocumentKind declares`,
				"add it here, or remove it from the union in packages/db/src/schema.ts",
			);
		}

		for (const kind of extra) {
			report(
				"kinds",
				one.path,
				`carries "${kind}", which DocumentKind does not declare`,
				"add it to the union in packages/db/src/schema.ts, or remove it here",
			);
		}
	}
}

/**
 * `_artifacts/domain_map.yaml` still describes the workspace it maps.
 *
 * The directory name is the intent tool's, not this repo's - `_artifacts` is
 * where `@tanstack/intent` looks, the way `.github/` is where Actions looks -
 * so it stays, and this makes its contents answerable.
 *
 * Two ways it went wrong at once, both silently. It listed a skill for
 * `product-viewer` at a path that has never existed, and it was four packages
 * behind the workspace: `access`, `cli`, `github` and `http` appeared neither
 * as a skill nor in `ignored_packages`. A map of the repository that has
 * drifted from the repository is worse than none, because it answers.
 */
function checkDomainMapCoversPackages() {
	for (const path of [
		"_artifacts/domain_map.yaml",
		"_artifacts/skill_tree.yaml",
	]) {
		checkOneMap(path);
	}
}

/** One of the two intent maps, against the workspace it describes. */
function checkOneMap(path) {
	const map = read(path);

	if (!map) {
		report(
			"domain-map",
			path,
			"missing",
			"`intent` reads it; write it or drop the tool",
		);
		return;
	}

	for (const claimed of [...map.matchAll(/^\s*path: (\S+)/gm)].map(
		(m) => m[1],
	)) {
		if (!exists(claimed)) {
			report(
				"domain-map",
				path,
				`names a skill at ${claimed}, which does not exist`,
				"write it, or remove the entry and account for the package under `ignored_packages`",
			);
		}
	}

	const named = new Set(
		[...map.matchAll(/'(@sushindustries\/[a-z-]+)'/g)].map((m) => m[1]),
	);

	for (const workspace of list) {
		if (!workspace.startsWith("packages/")) continue;

		const manifest = readJson(`${workspace}/package.json`);
		if (!manifest.name || manifest.private) continue;

		if (!named.has(manifest.name)) {
			report(
				"domain-map",
				path,
				`does not account for ${manifest.name}`,
				"add a skill entry, or name it under `coverage.ignored_packages` with the reason",
			);
		}
	}
}

/**
 * A comment that cites a file cites one that exists.
 *
 * Twice in one day this repository was wrong in exactly this way, and neither
 * time did anything fail. `schema.ts` and `documents.schemas.ts` both said
 * documents.schemas.test.ts asserted the document kinds agreed, and that
 * file has never existed - so the guard four declarations relied on was a
 * sentence two files repeated to each other. The intent map named a skill at
 * packages/product-viewer/skills/core/SKILL.md, which has also never
 * existed.
 *
 * Deliberately narrow. Only paths that start with a directory this repository
 * actually has are considered, which is what keeps it from flagging the
 * `foo.ts` in an example or the bare `.server.ts` in a sentence about
 * suffixes. A check that cries wolf on prose is a check people learn to skip,
 * and this one has to be trusted precisely because nothing else looks here.
 */
function checkCitedFilesExist() {
	/*
	 * The directories this repository actually has, read from it rather than
	 * typed here. A hand-written list would need a line the day a top-level
	 * directory is added, and the failure would be silent: paths under the new
	 * one would simply stop being checked.
	 */
	const roots = [
		...new Set(
			trackedFiles()
				.filter((path) => path.includes("/"))
				.map((path) => `${path.split("/")[0]}/`),
		),
	];

	for (const file of trackedFiles()) {
		/*
		 * Code only. Markdown here is teaching, and teaching cites files that
		 * deliberately do not exist: the output `pnpm new post my-post` would
		 * write, or the misplaced file an incident is about. Flagging those
		 * taught people to skip the category, and the two bugs worth catching -
		 * a schema comment naming a test nobody wrote, an intent map naming a
		 * skill nobody wrote - were both in code and in YAML.
		 */
		if (!/\.(ts|tsx|mjs)$/.test(file)) continue;
		// The fetched provider indexes are somebody else's prose about their
		// own repositories, and every path in them is theirs.
		if (file.startsWith("packages/cli/references/")) continue;

		const text = read(file);
		if (!text) continue;

		for (const [, cited] of text.matchAll(
			/`([a-zA-Z0-9_./-]+\.(?:ts|tsx|mjs|md|css|json|yaml))`/g,
		)) {
			if (!roots.some((one) => cited.startsWith(one))) continue;
			if (exists(cited)) continue;

			report(
				"citation",
				file,
				`cites \`${cited}\`, which does not exist`,
				"write it, correct the path, or delete the claim - a comment naming a file nobody wrote is a guard that is not there",
			);
		}
	}
}

/**
 * No package depends on an app, and no two packages depend on each other.
 *
 * The two failures that are wrong at any size rather than a matter of degree.
 * A cycle means neither package can be installed without the other, so the
 * cascade from a change in one comes back round to itself. An inversion - a
 * package depending on an app - means the package cannot be installed by
 * anybody but this repository, which for something published is the whole
 * point undone.
 *
 * Computed here from the manifests rather than imported from
 * `packages/cli/commands/map.mjs`, which draws the same graph. That is a
 * deliberate duplication and the only one in this file: `scripts/` is the gate
 * and must run on a bare `pnpm install` with nothing between it and the
 * filesystem, and reaching into a workspace package for a twenty-line
 * traversal would make the gate depend on the thing it is gating.
 */
/**
 * Server-only code is named, not filed.
 *
 * TanStack Start keeps `.server.*` out of the client bundle by matching a
 * glob, and the glob needs a segment before `.server.` - so protection is a
 * property of the *file name* and of nothing else. A `server/` directory,
 * which is how most module-architecture guides lay this out, matches neither
 * pattern and is therefore not protected at all: a repository file reading
 * `DATABASE_URL` inside one builds clean, with no diagnostic anywhere, and
 * ships to the browser.
 *
 * Measured rather than assumed, on 2026-08-19 and again when this was
 * written: a bare `server.ts` reading `process.env.DATABASE_URL` and imported
 * from a route component built with zero errors, while the same file renamed
 * `probe.server.ts` failed the build. `vite.config.ts` carries the note.
 *
 * The patterns are read out of that config rather than repeated here. Two
 * copies of a rule is a rule that will disagree with itself, and this one
 * would disagree silently - the check would keep passing against patterns the
 * build no longer uses.
 */
function checkServerCodeIsNamedNotFiled() {
	const config = read("apps/web/vite.config.ts");

	const declared = /files:\s*\[([^\]]*)\]/.exec(config)?.[1];
	if (!declared) {
		report(
			"import-protection",
			"apps/web/vite.config.ts",
			"no `files` array under importProtection, so nothing here can be checked",
			"restate the client deny patterns, or delete this check",
		);
		return;
	}

	const patterns = [...declared.matchAll(/"([^"]+)"/g)].map((one) => one[1]);

	/*
	 * A directory is protected only if some pattern would match a file placed
	 * directly inside it. `**​/*.server.*` needs a dot-segment in the name and
	 * `**​/server.ts` needs the file itself to be called that, so neither ever
	 * covers `server/anything.ts` - but this asks the patterns rather than
	 * asserting it, so a future pattern that *does* cover it turns this check
	 * off by itself instead of producing a false report.
	 */
	const covered = patterns.some((pattern) => /^\*\*\/server\/\*/.test(pattern));
	if (covered) return;

	for (const path of trackedFiles()) {
		if (!path.startsWith("apps/web/src/")) continue;
		if (!/\.tsx?$/.test(path)) continue;
		if (!path.split("/").slice(0, -1).includes("server")) continue;

		report(
			"import-protection",
			path,
			"sits in a `server/` directory, which no client deny pattern matches",
			"rename it `<something>.server.ts`; the suffix is what the build enforces",
		);
	}
}

function checkGraphIsAcyclic() {
	const edges = new Map();
	const apps = new Set();

	for (const workspace of list) {
		const manifest = readJson(`${workspace}/package.json`);
		if (!manifest.name) continue;

		if (!workspace.startsWith("packages/")) apps.add(manifest.name);

		edges.set(
			manifest.name,
			Object.keys({
				...manifest.dependencies,
				...manifest.devDependencies,
			}).filter((one) => one.startsWith("@sushindustries/")),
		);
	}

	for (const [name, deps] of edges) {
		if (apps.has(name)) continue;

		for (const dep of deps) {
			if (apps.has(dep)) {
				report(
					"graph",
					`${name} -> ${dep}`,
					"a package depends on an app",
					"an app is a sink - nothing installs it, so this package cannot be installed by anybody else either",
				);
			}
		}
	}

	const seen = new Set();

	const walk = (node, trail) => {
		if (trail.includes(node)) {
			const loop = trail.slice(trail.indexOf(node)).concat(node);
			const signature = [...loop].sort().join(">");
			if (!seen.has(signature)) {
				seen.add(signature);
				report(
					"graph",
					loop.map((one) => one.replace("@sushindustries/", "")).join(" -> "),
					"these packages depend on each other",
					"neither can be installed without the other - break the weaker edge, or move what they share into a third",
				);
			}
			return;
		}
		for (const next of edges.get(node) ?? []) walk(next, [...trail, node]);
	};

	for (const name of edges.keys()) walk(name, []);
}

/**
 * `stack.yaml` still states the versions the workspace actually installs.
 *
 * The file is written by hand because the sentence on each entry - why this
 * dependency, in this repo - is the half a lockfile has never known. The
 * version beside it is the half that can be derived, and `pnpm sushindustries
 * stack --sync` rewrites it.
 *
 * Nothing checked that anybody had. A stack file claiming a version nobody is
 * running is worse than no stack file, because it reads as current: the table
 * it generates goes on the site, and the reference shards are fetched against
 * whatever it says. This is the check that makes `--sync` something the gate
 * asks for rather than something somebody remembers.
 *
 * Parsed here rather than through `parseStack` in the CLI, for the reason the
 * graph check gives: the gate must not depend on the thing it is gating. The
 * format is flat `key: value` precisely so that costs about ten lines.
 */
function checkStackVersionsAreCurrent() {
	const path = "packages/cli/stack.yaml";
	const raw = read(path);
	if (!raw) return;

	/* Every version this workspace declares, by package name. */
	const installed = new Map();

	for (const workspace of ["", ...list]) {
		const manifest = readJson(
			workspace ? `${workspace}/package.json` : "package.json",
		);
		for (const [name, version] of Object.entries({
			...manifest.dependencies,
			...manifest.devDependencies,
		})) {
			if (!installed.has(name)) installed.set(name, String(version));
		}
	}

	let pkg = null;

	for (const line of raw.split("\n")) {
		const field = /^\s*-?\s*(package|version):\s*(\S+)/.exec(line);
		if (!field) continue;

		if (field[1] === "package") {
			pkg = field[2];
			continue;
		}

		if (!pkg) continue;

		const declared = field[2];
		const named = pkg;
		const actual = installed.get(named);
		pkg = null;

		// Only what this workspace installs. The stack lists tools and services
		// that are not npm packages at all, and they have no version to check.
		if (!actual) continue;

		const bare = actual.replace(/^[\^~>=<\s]+/, "");
		if (bare === declared) continue;

		report(
			"stack",
			path,
			`says ${declared} for ${named}, where the workspace installs ${bare}`,
			"pnpm sushindustries stack --sync",
		);
	}
}

/**
 * Every command, skill and agent carries the frontmatter its kind needs.
 *
 * The three are not the same shape, and the differences are load-bearing:
 *
 *   command  `description` only. The name comes from the filename, which is
 *            why 335 of the 1,901 commands installed on this machine carry
 *            exactly that and nothing else. A command with no description is
 *            a slash command with no help text next to it.
 *   skill    `name` and `description`. The description is not documentation -
 *            it is the entire basis on which a skill is chosen, so a vague one
 *            is a skill that never loads.
 *   agent    `name` and `description`, and `tools` if it should not have all
 *            of them. An agent with no `tools` line gets everything, which is
 *            how a judging agent ends up able to edit.
 *
 * Checked because none of it fails loudly. A missing description costs nothing
 * at load time and everything at the moment somebody needed the thing to be
 * found.
 */
function checkAuthoredFrontmatter() {
	const kinds = [
		{
			glob: "commands",
			required: ["description"],
			where: "plugins/*/commands",
		},
		{ glob: "skills", required: ["name", "description"], where: "skills" },
		{ glob: "agents", required: ["name", "description"], where: "agents" },
	];

	const files = trackedFiles().filter(
		(path) =>
			path.endsWith(".md") &&
			(path.includes("/commands/") ||
				path.includes("/agents/") ||
				path.endsWith("SKILL.md")),
	);

	for (const file of files) {
		const kind = file.endsWith("SKILL.md")
			? kinds[1]
			: file.includes("/commands/")
				? kinds[0]
				: kinds[2];

		const raw = read(file) ?? "";
		const front = /^---\n([\s\S]*?)\n---/.exec(raw);

		if (!front) {
			report(
				"frontmatter",
				file,
				"has no frontmatter",
				`a ${kind.glob.replace(/s$/, "")} needs ${kind.required.join(" and ")}`,
			);
			continue;
		}

		for (const key of kind.required) {
			// `key:` at the start of a line, so a word inside a description
			// cannot satisfy the check for a field that is not there.
			if (new RegExp(`^${key}:`, "m").test(front[1])) continue;

			report(
				"frontmatter",
				file,
				`has no \`${key}\``,
				`a ${kind.glob.replace(/s$/, "")} without it cannot be found by the thing that looks for it`,
			);
		}
	}
}

/**
 * Every named operation still validates against the schema it is served over.
 *
 * `apollo/operations/*.graphql` is not documentation: each file becomes one
 * tool on the Apollo MCP server, and `apollo/config.yaml` keeps introspection
 * off precisely so those operations are the whole surface. The schema they run
 * against is generated from the Drizzle tables.
 *
 * So a renamed column rewrites the schema, and an operation selecting the old
 * field becomes invalid with nothing to say so - the tool simply fails for
 * whoever is holding it, at a moment nobody is watching. That is the same
 * drift the rest of this file exists to refuse, and it is the one place the
 * repository ships a query somebody else executes.
 *
 * Validated with `graphql` itself rather than by pattern. A regular expression
 * over a selection set can tell you a field name appears; only the validator
 * knows whether it exists on the type being selected from, and that difference
 * is the entire value of the check.
 */
async function checkGraphqlOperationsValidate() {
	/*
	 * `schema.graphql` alone: the generator already appends `queries.graphql`
	 * into it, so reading both and concatenating defines every hand-written
	 * type twice and the schema stops building. One file is the contract, which
	 * is what that generator's own comment says.
	 */
	const sdl = read("apollo/schema.graphql");
	if (!sdl) return;

	let graphql;
	try {
		graphql = await import("graphql");
	} catch (error) {
		/*
		 * Reported, not skipped, and the difference is the whole value of this
		 * check. It first shipped with a silent `return` here on the theory
		 * that a missing parser should not stop the gate - and `graphql` was
		 * not resolvable from the repo root under pnpm, so for its entire life
		 * the check ran, found nothing, and passed. A canary operation with a
		 * misspelt field went through it clean.
		 *
		 * `graphql` is a root devDependency now, so the only way to reach this
		 * is a broken install, which is a thing to be told about rather than a
		 * reason to quietly stop checking ten files.
		 */
		report(
			"operations",
			"package.json",
			`cannot load graphql, so no operation was checked: ${error.message.split("\n")[0]}`,
			"pnpm install - graphql is a root devDependency and this check needs it",
		);
		return;
	}

	let schema;
	try {
		schema = graphql.buildSchema(sdl);
	} catch (error) {
		report(
			"operations",
			"apollo/schema.graphql",
			`does not parse: ${error.message.split("\n")[0]}`,
			"pnpm sushindustries graphql regenerates it from the tables",
		);
		return;
	}

	for (const file of trackedFiles()) {
		if (!file.startsWith("apollo/operations/") || !file.endsWith(".graphql")) {
			continue;
		}

		const source = read(file);
		if (!source) continue;

		let document;
		try {
			document = graphql.parse(source);
		} catch (error) {
			report(
				"operations",
				file,
				`does not parse: ${error.message.split("\n")[0]}`,
				"an operation that cannot be parsed is a tool that cannot start",
			);
			continue;
		}

		for (const problem of graphql.validate(schema, document)) {
			report(
				"operations",
				file,
				problem.message,
				"the schema is generated from the Drizzle tables - either the operation is out of date, or the column it wants is gone",
			);
		}
	}
}

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
 * An unclosed block is consumed as empty by `@tanstack/markdown` - the
 * content meant to be inside it vanishes, while everything after it keeps
 * rendering as ordinary prose. Nothing errors either way: a misspelled
 * block name also renders as nothing, silently. Both are authoring mistakes
 * a template system must catch at the gate, not read as a shorter page in
 * production.
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
	const layerOrder =
		/@layer ([\w, ]+);/.exec(read(ATOMS_ENTRY))?.[1] ??
		"(no layer declaration)";

	/* Which layer each chapter lands in: from its import, or from its own tag. */
	const chapters = atomsFiles().map((file) => ({
		path: file.path.replace("packages/atoms/src/", ""),
		layer: file.assignedLayer ?? /@layer (\w+) \{/.exec(file.css)?.[1],
	}));

	console.log("# How this repo is constructed\n");

	console.log("## Workspaces\n");
	for (const workspace of list) {
		const meta = JSON.parse(read(`${workspace}/package.json`));
		console.log(`- ${meta.name} (${workspace}) - ${meta.description ?? ""}`);
	}

	console.log(`\n## The cascade\n\nLayer order: ${layerOrder}`);
	for (const name of layerOrder.split(",").map((part) => part.trim())) {
		const own = chapters.filter((chapter) => chapter.layer === name);
		console.log(
			`- ${name}: ${own.length} file(s) - ${own.map((c) => c.path).join(", ")}`,
		);
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
/*
 * The drift subset first, so `--drift` can stop after it.
 *
 * Order is otherwise unimportant here - every check reads and reports, none
 * depends on another having run.
 */
checkGeneratedFilesAreOrdered();
checkDocumentKindsAgree();
checkGraphIsAcyclic();
checkServerCodeIsNamedNotFiled();
checkStackVersionsAreCurrent();
checkAuthoredFrontmatter();
await checkGraphqlOperationsValidate();
checkDomainMapCoversPackages();
checkCitedFilesExist();

if (!driftOnly) {
	checkWorkspaceDescriptions(list);
	checkLicences(list);
	checkTypecheckHasConfig(list);
	checkEveryScriptIsRun(list);
	checkBuildsShareTheBase(list);
	checkPushGateDelegates();
	checkElementsDeclareSchemaType(registry);
	checkRegistryFilesExist(registry);
	checkRegistryVariantsExist(registry);
	checkRegistryDependenciesResolve(registry);
	checkComponentImportsAreDeclared(registry);
	checkAtomsAreLayered();
	checkGridsAreResponsive();
	checkTaxonomyIsDeclared(registry);
	checkNothingIsDuplicated(registry);
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
	checkDocsAreAddressable();
	checkDeskLabelsFit();
	checkOriginIsWrittenOnce();
	checkDocsFollowTheContract();
	await checkApiDocsMatchSource(registry);
	checkDocsHaveSummaries(registry);
	checkRegistryItemsAreAddressable(registry);
	checkMentionsAreReferences(registry);
	checkCategoriesHaveIcons();
	checkComponentClassesLiveInAtoms();
	checkVariantsAreAttributes();
	checkBlocksAreEarned();
	checkAtomsUseTokens();
	checkDepthsUseTokens();
	checkTokensResolve();
	checkNoEmDashes();
	checkReadmeMedia();
	checkShotsAreFresh();
	checkRoutesAreLeaves();
	checkBlocksResolve();
	checkBlockTargetsExist();
	checkPagesAreReachable();
	checkReadmesShowUsage();
}

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
	console.error("Some of these repair themselves: pnpm run doctor --fix");
}

process.exit(1);
