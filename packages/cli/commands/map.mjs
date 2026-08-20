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
import { flags, read, root } from "../lib/context.mjs";
import { banner, blank, bold, cyan, dim, field, note, ok } from "../lib/ui.mjs";

const SCOPE = "@sushindustries/";

/**
 * Where the workspaces are, read from `pnpm-workspace.yaml`.
 *
 * `apps/*` and `packages/*` were written here, which made this command a map
 * of this repository specifically rather than of a pnpm workspace. The globs
 * are already declared one file away and a repository that added a third root
 * would have had a map quietly missing a third of itself.
 */
function workspaceGlobs() {
	const declared = read("pnpm-workspace.yaml") ?? "";

	const globs = [];
	let inPackages = false;

	for (const line of declared.split("\n")) {
		if (/^packages:\s*$/.test(line)) {
			inPackages = true;
			continue;
		}
		if (inPackages) {
			const entry = /^\s+-\s+['"]?([^'"\s#]+)/.exec(line);
			if (entry?.[1]) {
				globs.push(entry[1]);
				continue;
			}
			// The list ended at the first line that is not an entry.
			if (line.trim() && !line.trimStart().startsWith("#")) break;
		}
	}

	// A workspace with no declaration is still a workspace of one.
	return globs.length > 0 ? globs : ["."];
}

/** Every workspace manifest, as `{ dir, name, description, deps }`. */
function workspaces() {
	const manifests = workspaceGlobs()
		.flatMap((glob) => globSync(`${glob}/package.json`, { cwd: root }))
		.sort();

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

/*
 * ── whether the shape is earned ──────────────────────────────────────────
 *
 * A dependency graph is the one place complexity is measurable rather than
 * felt. Four things it can say, and each is a question about universality:
 *
 *   cycles       two packages that cannot be installed independently. Always
 *                wrong, never a matter of degree.
 *   inversions   a package depending on an app. The package is no longer
 *                installable by anybody but this repository.
 *   fan-out      how much of this workspace you must take to take one piece.
 *                A package with none is portable; one with four is a branch.
 *   depth        the longest chain. Every link is a rebuild somebody waits
 *                for and a version somebody has to keep in step.
 *
 * None of these have a threshold here on purpose. The numbers are reported and
 * the two that are unambiguous - cycles and inversions - are what `pnpm run
 * doctor` refuses. A budget on the other two would be a number somebody picked,
 * and it would be argued with rather than acted on.
 */

/** Every cycle in the internal dependency graph, as chains of names. */
function cycles(list) {
	const edges = new Map(
		list.map((one) => [
			one.name,
			one.deps.filter((d) => list.some((w) => w.name === d)),
		]),
	);

	const found = [];
	const seen = new Set();

	const walk = (node, trail) => {
		const at = trail.indexOf(node);
		if (at !== -1) {
			const loop = trail.slice(at).concat(node);
			const signature = [...loop].sort().join(">");
			if (!seen.has(signature)) {
				seen.add(signature);
				found.push(loop);
			}
			return;
		}
		for (const next of edges.get(node) ?? []) walk(next, [...trail, node]);
	};

	for (const one of list) walk(one.name, []);
	return found;
}

/** A package that depends on an app cannot be installed on its own. */
function inversions(list) {
	const apps = new Set(
		list
			.filter((one) => !one.dir.startsWith("packages/"))
			.map((one) => one.name),
	);

	return list
		.filter((one) => one.dir.startsWith("packages/"))
		.flatMap((one) =>
			one.deps
				.filter((d) => apps.has(d))
				.map((d) => ({ from: one.short, to: d })),
		);
}

/** The longest chain of internal dependencies, as names. */
function deepest(list) {
	const edges = new Map(
		list.map((one) => [
			one.name,
			one.deps.filter((d) => list.some((w) => w.name === d)),
		]),
	);

	let longest = [];

	const walk = (node, trail) => {
		if (trail.includes(node)) return;
		const path = [...trail, node];
		if (path.length > longest.length) longest = path;
		for (const next of edges.get(node) ?? []) walk(next, path);
	};

	for (const one of list) walk(one.name, []);
	return longest;
}

export function complexity(list) {
	const internal = (one) =>
		one.deps.filter((d) => list.some((w) => w.name === d));

	const loops = cycles(list);
	const inverted = inversions(list);
	const chain = deepest(list);

	const portable = list.filter(
		(one) => one.dir.startsWith("packages/") && internal(one).length === 0,
	);

	return { loops, inverted, chain, portable, internal };
}

export function map() {
	const list = workspaces();
	const modules = siteModules();

	if (flags.has("--mermaid")) {
		console.log(mermaid(list, modules));
		return;
	}

	/*
	 * The facts, with no prose around them.
	 *
	 * This exists for the agent that judges the shape. It used to be given the
	 * human output plus a skill to interpret it plus permission to grep, which
	 * is three sources and an invitation to go looking - about four thousand
	 * tokens before it had an opinion. Everything a verdict needs is computable
	 * here, so it is computed here, and the reader's whole job becomes reading
	 * one object.
	 *
	 * Deliberately not the file counts or the line counts. Those are interesting
	 * to a person browsing and irrelevant to whether the shape is earned, and
	 * every field that goes into this is a field somebody pays for.
	 */
	if (flags.has("--json")) {
		const shape = complexity(list);

		console.log(
			JSON.stringify(
				{
					packages: list
						.filter((one) => one.dir.startsWith("packages/"))
						.map((one) => ({
							name: one.short,
							dependsOn: shape.internal(one).map((d) => d.replace(SCOPE, "")),
							usedBy: list
								.filter((other) => other.deps.includes(one.name))
								.map((other) => other.short),
						})),
					apps: list
						.filter((one) => !one.dir.startsWith("packages/"))
						.map((one) => ({
							name: one.short,
							dependsOn: shape.internal(one).map((d) => d.replace(SCOPE, "")),
						})),
					cycles: shape.loops.map((loop) =>
						loop.map((n) => n.replace(SCOPE, "")),
					),
					inversions: shape.inverted,
					deepestChain: shape.chain.map((n) => n.replace(SCOPE, "")),
					portable: shape.portable.map((one) => one.short),
				},
				null,
				"\t",
			),
		);
		return;
	}

	banner("map");
	note("Derived from the workspace manifests, not from a diagram.");
	blank();

	/*
	 * Grouped by the roots the workspace declares, in the order it declares
	 * them, rather than by two names this command used to know.
	 */
	const groups = [...new Set(list.map((one) => `${one.dir.split("/")[0]}/`))];

	for (const group of groups) {
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

	const shape = complexity(list);

	console.log(`  ${bold("is the shape earned")}`);

	for (const loop of shape.loops) {
		console.log(
			`    ${dim("cycle")}      ${loop.map((n) => n.replace(SCOPE, "")).join(" -> ")}`,
		);
	}
	for (const one of shape.inverted) {
		console.log(
			`    ${dim("inversion")}  ${one.from} depends on ${one.to.replace(SCOPE, "")}, which is an app`,
		);
	}
	if (shape.loops.length === 0 && shape.inverted.length === 0) {
		console.log(`    ${dim("no cycles, no package depending on an app")}`);
	}

	console.log(
		`    ${dim("portable")}   ${shape.portable.length} of ${list.filter((o) => o.dir.startsWith("packages/")).length} packages install with nothing else from here`,
	);
	console.log(
		`    ${dim("deepest")}    ${shape.chain.map((n) => n.replace(SCOPE, "")).join(" -> ")}`,
	);
	blank();

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
