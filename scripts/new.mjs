#!/usr/bin/env node

/*
 * Start a new thing from the template for it.
 *
 *   pnpm new post <slug>
 *   pnpm new component <slug>
 *   pnpm new package <slug>
 *
 * This writes the files whose contents are the same every time and stops. It
 * does not write the parts that carry meaning - a summary, a description, a
 * demo - because a scaffold that fills those in with placeholder text produces
 * a file that looks finished and is not, and `pnpm doctor` can no longer tell
 * the difference.
 *
 * What it does do is the bookkeeping nobody remembers: the barrel export, the
 * registry entry, the Dockerfile line. Those are the steps that are invisible
 * until a deploy fails.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFrom } from "./templates.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [kind, slug] = process.argv.slice(2);

function fail(message) {
	console.error(message);
	process.exit(1);
}

if (!kind || !slug) {
	fail("Usage: pnpm new <post|component|package> <slug>");
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
	fail(
		`"${slug}" is not a slug. Lowercase, digits and single hyphens - it becomes a URL and a filename.`,
	);
}

/** `doc-aside` → `Doc Aside`. */
function titleCase(value) {
	return value
		.split("-")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

/** `doc-aside` → `DocAside`. */
function pascalCase(value) {
	return titleCase(value).replaceAll(" ", "");
}

function edit(path, change) {
	const full = join(root, path);
	const before = readFileSync(full, "utf8");
	const after = change(before);

	if (after === before) return false;

	writeFileSync(full, after);
	return true;
}

const written = [];
const todo = [];

/* ── post ────────────────────────────────────────────────────────────── */

async function newPost() {
	const target = `apps/web/content/posts/${slug}.md`;

	await writeFrom("post", target, {
		slug,
		title: titleCase(slug),
		date: new Date().toISOString().slice(0, 10),
	});

	written.push(target);
	todo.push(`write \`summary:\` in ${target} - it is what the index shows`);
	todo.push(`set \`draft: false\` when it should be public`);
}

/* ── component ───────────────────────────────────────────────────────── */

async function newComponent() {
	const source = `packages/ui/src/${slug}.tsx`;
	const doc = `packages/ui/docs/${slug}/index.md`;

	await writeFrom("component-source.tsx", source, {
		slug,
		pascal: pascalCase(slug),
		title: titleCase(slug),
	});
	written.push(source);

	await writeFrom("component-index", doc, { slug, title: titleCase(slug) });
	written.push(doc);

	/*
	 * The barrel. Exports are sorted, so this inserts rather than appends -
	 * biome would otherwise reorder it on the next commit and the diff would
	 * blame the wrong change.
	 */
	const line = `export * from "./${slug}";`;
	const added = edit("packages/ui/src/index.ts", (before) => {
		if (before.includes(line)) return before;

		const lines = before.split("\n");
		const first = lines.findIndex((entry) => entry.startsWith("export * from"));
		if (first === -1) return `${before.trimEnd()}\n${line}\n`;

		let at = lines.length;
		for (let index = first; index < lines.length; index += 1) {
			if (!lines[index].startsWith("export * from")) continue;
			if (lines[index] > line) {
				at = index;
				break;
			}
			at = index + 1;
		}

		lines.splice(at, 0, line);
		return lines.join("\n");
	});

	if (added) written.push("packages/ui/src/index.ts");

	/*
	 * The registry entry. Appended with the fields that have no sensible
	 * default left empty rather than guessed - `category` and `preview` decide
	 * where the component lands in the archive and what a reader sees on the
	 * card, and getting either wrong silently is worse than not having it.
	 */
	const entry = [
		"\t{",
		`\t\tname: "${slug}",`,
		`\t\ttitle: "${titleCase(slug)}",`,
		'\t\tdescription: "",',
		`\t\tfiles: ["${slug}.tsx"],`,
		"\t\tdependencies: {},",
		'\t\tcategory: "layout",',
		'\t\tpreview: "",',
		"\t},",
	].join("\n");

	const registered = edit("packages/ui/registry.ts", (before) => {
		if (before.includes(`name: "${slug}"`)) return before;
		const at = before.lastIndexOf("\n];");
		if (at === -1) return before;
		return `${before.slice(0, at)}\n${entry}${before.slice(at)}`;
	});

	if (registered) written.push("packages/ui/registry.ts");

	todo.push(
		`fill in \`description\`, \`category\` and \`preview\` for "${slug}" in packages/ui/registry.ts`,
	);
	todo.push(
		`add a "${slug}" demo to apps/web/src/modules/showcase/demos.tsx - until then its card shows nothing`,
	);
	todo.push(`write \`summary:\` in ${doc}`);
}

/* ── package ─────────────────────────────────────────────────────────── */

async function newPackage() {
	const dir = `packages/${slug}`;
	const name = `@sushindustries/${slug}`;

	await mkdir(join(root, dir), { recursive: true });

	writeFileSync(
		join(root, dir, "package.json"),
		`${JSON.stringify(
			{
				name,
				version: "0.1.0",
				description: "",
				type: "module",
				license: "MIT",
				publishConfig: { access: "public" },
				exports: { ".": "./src/index.ts" },
				files: ["src"],
			},
			null,
			"\t",
		)}\n`,
	);
	written.push(`${dir}/package.json`);

	await writeFrom("package-readme", `${dir}/README.md`, {
		slug,
		name,
		description: "",
	});
	written.push(`${dir}/README.md`);

	await mkdir(join(root, dir, "src"), { recursive: true });
	writeFileSync(join(root, dir, "src", "index.ts"), "export {};\n");
	written.push(`${dir}/src/index.ts`);

	todo.push(`write \`description\` in ${dir}/package.json`);
	todo.push(
		"run `pnpm doctor --fix` to add the Dockerfile line, then `pnpm i`",
	);
}

/* ── glyph ───────────────────────────────────────────────────────────── */

/*
 * A row in the glyph table, with the path left empty.
 *
 * Deliberately not a placeholder square. A glyph that renders as something is
 * a glyph nobody notices they never drew, and it ships in a menu looking like
 * a decision. `pnpm doctor` reports an empty path and refuses to regenerate.
 */
async function newGlyph() {
	const table = "packages/ui/glyphs.md";

	const added = edit(table, (before) => {
		if (before.includes(`| ${slug} |`)) return before;

		const rows = before.split("\n");
		const last = rows.findLastIndex((row) => row.startsWith("| "));
		if (last === -1) return before;

		rows.splice(last + 1, 0, `| ${slug} | \`\` | |`);
		return rows.join("\n");
	});

	if (!added) {
		fail(`"${slug}" is already in ${table}.`);
	}

	written.push(table);
	todo.push(`draw \`${slug}\`: one or more paths in a 24x24 box, in ${table}`);
	todo.push("say why that drawing in the third column");
	todo.push("run `pnpm doctor --fix` to regenerate packages/ui/src/icon.tsx");
}

/* ── run ─────────────────────────────────────────────────────────────── */

const kinds = {
	post: newPost,
	component: newComponent,
	package: newPackage,
	glyph: newGlyph,
};

if (!(kind in kinds)) {
	fail(`No template for "${kind}". One of: ${Object.keys(kinds).join(", ")}.`);
}

await kinds[kind]();

console.log(`Wrote ${written.length}:`);
for (const path of written) console.log(`  + ${path}`);

if (todo.length > 0) {
	console.log("\nStill yours to write:");
	for (const item of todo) console.log(`  · ${item}`);
}

console.log("\nThen: pnpm doctor");
