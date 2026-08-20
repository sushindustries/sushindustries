/*
 * The shape of this repository, read from the repository.
 *
 * Every other answer to "how is this put together" is a diagram somebody drew
 * and stopped updating. This one is derived: the nodes are the workspaces that
 * exist, the edges are the dependencies they declare on each other, and the
 * counts under each are files on disk. A package added tomorrow appears here
 * with nothing edited, and a package deleted stops appearing.
 *
 * Two outputs, because there are two readers. `--mermaid` writes a graph a
 * browser or a Markdown viewer draws; the default prints the same thing as
 * text for a terminal that is not going to render anything. Neither is the
 * source - both are views of the manifests.
 */

import { globSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { flags, root } from "../lib/context.mjs";
import { banner, blank, bold, cyan, dim, field, note, ok } from "../lib/ui.mjs";

const SCOPE = "@sushindustries/";

/** Every workspace manifest, as `{ dir, name, description, deps }`. */
function workspaces() {
	const manifests = [
		...globSync("apps/*/package.json", { cwd: root }),
		...globSync("packages/*/package.json", { cwd: root }),
	].sort();

	return manifests.flatMap((relative) => {
		const manifest = JSON.parse(readFileSync(join(root, relative), "utf8"));
		if (!manifest.name) return [];

		const dir = relative.replace("/package.json", "");

		/*
		 * Only edges inside this repository. A node for every npm dependency
		 * would be a graph of the ecosystem rather than of this repo, and the
		 * question being asked is what *we* built out of what *we* built.
		 */
		const deps = Object.keys({
			...manifest.dependencies,
			...manifest.devDependencies,
		})
			.filter((one) => one.startsWith(SCOPE))
			.sort();

		return [
			{
				dir,
				name: manifest.name,
				short: manifest.name.slice(SCOPE.length),
				description: manifest.description ?? "",
				deps,
			},
		];
	});
}

/** How many source files a workspace holds. Cheap, and enough to show weight. */
function weigh(dir) {
	const files = globSync("src/**/*.{ts,tsx,mjs,css}", { cwd: join(root, dir) });
	const lines = files.reduce((total, file) => {
		try {
			const text = readFileSync(join(root, dir, file), "utf8");
			return total + text.split("\n").length;
		} catch {
			return total;
		}
	}, 0);
	return { files: files.length, lines };
}

/** The site's own domains, which are a layer the manifests cannot see. */
function siteModules() {
	const base = "apps/web/src/modules";
	try {
		statSync(join(root, base));
	} catch {
		return [];
	}

	return globSync("*", { cwd: join(root, base) })
		.filter((name) => {
			try {
				return statSync(join(root, base, name)).isDirectory();
			} catch {
				return false;
			}
		})
		.map((name) => ({
			name,
			features: globSync("*/", { cwd: join(root, base, name) }).length,
			files: globSync("**/*.{ts,tsx}", { cwd: join(root, base, name) }).length,
		}))
		.sort((a, b) => b.files - a.files);
}

function mermaid(list, modules) {
	const id = (name) => name.replace(/[^a-z0-9]/gi, "_");

	const lines = ["```mermaid", "graph TD", "	subgraph apps"];

	for (const one of list.filter((w) => w.dir.startsWith("apps/"))) {
		lines.push(`		${id(one.short)}["${one.short}"]`);
	}

	lines.push("	end", "	subgraph packages");

	for (const one of list.filter((w) => w.dir.startsWith("packages/"))) {
		lines.push(`		${id(one.short)}["${one.short}"]`);
	}

	lines.push("	end", "");

	for (const one of list) {
		for (const dep of one.deps) {
			const target = list.find((w) => w.name === dep);
			if (target) lines.push(`	${id(one.short)} --> ${id(target.short)}`);
		}
	}

	if (modules.length > 0) {
		lines.push("", "	subgraph web modules");
		for (const one of modules) {
			lines.push(`		mod_${id(one.name)}["${one.name} · ${one.files}"]`);
		}
		lines.push("	end");
	}

	lines.push("```");
	return lines.join("\n");
}

export function map() {
	const list = workspaces();
	const modules = siteModules();

	if (flags.has("--mermaid")) {
		console.log(mermaid(list, modules));
		return;
	}

	banner("map");
	note("Derived from the workspace manifests, not from a diagram.");
	blank();

	for (const group of ["apps/", "packages/"]) {
		console.log(`  ${bold(group.replace("/", ""))}`);

		for (const one of list.filter((w) => w.dir.startsWith(group))) {
			const { files, lines } = weigh(one.dir);
			const size = files > 0 ? dim(` ${files} files, ${lines} lines`) : "";
			console.log(`    ${cyan(one.short)}${size}`);

			if (one.deps.length > 0) {
				console.log(
					`      ${dim("needs")} ${one.deps.map((d) => d.slice(SCOPE.length)).join(", ")}`,
				);
			}
		}
		blank();
	}

	if (modules.length > 0) {
		console.log(`  ${bold("apps/web/src/modules")}`);
		for (const one of modules) {
			const features =
				one.features > 0 ? dim(` ${one.features} features,`) : "";
			console.log(
				`    ${cyan(one.name)}${features}${dim(` ${one.files} files`)}`,
			);
		}
		blank();
	}

	field("workspaces", String(list.length));
	field("modules", String(modules.length));
	field(
		"edges",
		String(
			list.reduce(
				(total, one) =>
					total + one.deps.filter((d) => list.some((w) => w.name === d)).length,
				0,
			),
		),
	);
	blank();
	note("`--mermaid` prints the same graph as a chart.");
	blank();
	ok("Mapped");
}
