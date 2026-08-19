/*
 * Reading and rendering the files in `templates/`.
 *
 * Its own module rather than a corner of the doctor, because both the doctor
 * and `pnpm new` need it and a script that runs checks on import is a script
 * that cannot be imported. That is not hypothetical: `pnpm new` silently did
 * nothing for exactly as long as these lived next to the doctor's run block.
 *
 * A template is a Markdown file whose first block is an HTML comment naming
 * where it goes and what tokens it takes. The comment is stripped on render, so
 * the template is a working preview of its own output - open `templates/post.md`
 * and you are looking at a post.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadTemplate(name) {
	const raw = readFileSync(join(root, "templates", `${name}.md`), "utf8");
	const match = raw.match(/^<!--\s*template\n([\s\S]*?)-->\n/);

	if (!match) {
		throw new Error(
			`templates/${name}.md has no <!-- template ... --> header, so nothing knows where it goes.`,
		);
	}

	const header = {};
	for (const line of match[1].split("\n")) {
		const separator = line.indexOf(":");
		if (separator === -1) continue;
		header[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
	}

	return { header, body: raw.slice(match[0].length) };
}

/**
 * `{token}` substitution, and that is the whole templating language.
 *
 * No conditionals and no loops on purpose: a template that can branch is a
 * program, a program that writes files wants tests, and at that point it is
 * cheaper to write the file by hand.
 */
export function render(body, tokens) {
	return body.replace(/\{(\w+)\}/g, (whole, key) =>
		key in tokens ? tokens[key] : whole,
	);
}

export async function writeFrom(name, target, tokens) {
	const { body } = loadTemplate(name);
	const full = join(root, target);

	await mkdir(dirname(full), { recursive: true });
	writeFileSync(full, render(body, tokens));
}
