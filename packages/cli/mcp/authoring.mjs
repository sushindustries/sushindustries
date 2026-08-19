/*
 * The authoring server: what this site serves, and how to add to it.
 *
 * Slugs are not listed here. They are read back from the site's own index, and
 * that distinction is the whole design: this repo builds every machine-
 * readable surface - the sitemap, its shards, llms.txt, the Markdown mirrors -
 * from one function over five catalogues, so the only honest answer to "what
 * slugs exist" is whatever that index produced. A second list maintained here
 * would be a second thing to keep in step, and it would be wrong first.
 *
 * So `list_slugs` asks the running site for its sitemap and reads the shards.
 * When nothing is running it falls back to the same catalogues the site reads,
 * and says which of the two answered - because "the repo says 74 and the
 * deployment says 71" is a finding, not a detail to paper over.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { root } from "../lib/context.mjs";
import { readRepo, text } from "./core.mjs";

const { loadTemplate } = await import(
	new URL("../../../scripts/templates.mjs", import.meta.url)
);

/** Where a caller most likely has the site running, in the order worth trying. */
const ORIGINS = ["http://localhost:3000", "https://adamjurek.com"];

const TEMPLATES = join(root, "templates");
const CONTENT = "apps/web/content";

/* ── slugs, from the site itself ─────────────────────────────────────── */

const locations = (xml) =>
	[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);

/**
 * Every path the site publishes, read from the sitemap it generates.
 *
 * Two hops, because the sitemap is an index: the first document lists the
 * shards and each shard lists the pages. That is the shape the site actually
 * serves, so following it is also a check that the sharding works.
 */
async function fromSitemap(origin) {
	const get = async (url) => {
		const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
		if (!response.ok) throw new Error(`${url} answered ${response.status}`);
		return response.text();
	};

	const index = await get(`${origin}/sitemap.xml`);
	const paths = [];

	for (const shard of locations(index)) {
		for (const url of locations(await get(shard))) {
			paths.push(new URL(url).pathname);
		}
	}

	return paths;
}

/**
 * The same answer, from the catalogues, when nothing is serving.
 *
 * Deliberately the poorer of the two. It reads the directories the site globs
 * and the registry it renders, which is close but not identical: the site
 * decides some of this at build time and a plain file read cannot.
 */
function fromRepo() {
	const paths = ["/"];

	const registry = readRepo("packages/ui/registry.ts");
	for (const [, name] of registry.matchAll(/^\t\tname:\s*"([^"]+)"/gm)) {
		paths.push(`/components/${name}`);
	}

	for (const workspace of readdirSync(join(root, "packages"))) {
		const manifest = join(root, "packages", workspace, "package.json");
		if (!existsSync(manifest)) continue;
		const parsed = JSON.parse(readFileSync(manifest, "utf8"));
		if (parsed.name && !parsed.private) paths.push(`/packages/${workspace}`);
	}

	for (const [kind, prefix] of [
		["posts", "/posts"],
		["pages", ""],
	]) {
		const dir = join(root, CONTENT, kind);
		if (!existsSync(dir)) continue;
		for (const file of readdirSync(dir).filter((name) =>
			name.endsWith(".md"),
		)) {
			paths.push(`${prefix}/${file.replace(/\.md$/, "")}`);
		}
	}

	return [...new Set(paths)].sort();
}

/** Grouped by first segment, which is how the site is organised anyway. */
function group(paths) {
	const sections = new Map();
	for (const path of paths) {
		const key = path === "/" ? "/" : `/${path.split("/")[1]}`;
		if (!sections.has(key)) sections.set(key, []);
		sections.get(key).push(path);
	}
	return [...sections.entries()].sort((a, b) => b[1].length - a[1].length);
}

/* ── writing ─────────────────────────────────────────────────────────── */

/**
 * What can be created, and what each one is called.
 *
 * One tool per kind rather than one `create` taking a kind, because a tool
 * named after the thing it makes is the one an agent picks correctly the first
 * time. The kinds themselves are `pnpm new`'s, and every one of them writes
 * from a file in `templates/` - so a template edited by hand changes what
 * these produce, with nothing here to keep in step.
 */
const CREATES = [
	["create-post", "post", "A written piece under /posts."],
	["create-page", "page", "A standing page at the top level, like /about."],
	[
		"create-collection",
		"collection",
		"A saved query over the documents index - a named filter, not a list. Membership is computed when somebody asks, so anything added later that matches joins it on its own. Use this when a set of documents is worth naming: `skills`, `conventions`, `component-api`.",
	],
	["create-desk", "desk", "A desktop arrangement rendered at its own path."],
	[
		"create-component",
		"component",
		"A component in packages/ui, with its five documents, its registry entry and its barrel export.",
	],
	[
		"create-package",
		"package",
		"A new workspace under packages/, with its README and its Dockerfile manifest line.",
	],
	[
		"create-docs",
		"docs",
		"One documentation section for something that already exists.",
	],
];

/**
 * Runs the repository's own scaffolder, and reports what appeared.
 *
 * Shelling out rather than reimplementing, because `pnpm new` already does the
 * bookkeeping that is invisible until a deploy fails: the barrel export, the
 * registry entry, the Dockerfile line. A second scaffolder here would do four
 * of those five and be wrong in a way nobody notices for a week.
 *
 * The file list comes from git rather than from the script's output, so what
 * is reported is what is actually on disk.
 */
async function create(kind, slug, section) {
	const { execFileSync } = await import("node:child_process");

	if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
		throw new Error(
			`"${slug}" is not a slug. Lowercase, digits and single hyphens - it becomes a URL and a filename.`,
		);
	}

	const before = tracked(execFileSync);

	let log;
	try {
		log = execFileSync(
			"node",
			["scripts/new.mjs", kind, slug, ...(section ? [section] : [])],
			{ cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
		);
	} catch (error) {
		throw new Error(
			error.stderr?.trim() || error.stdout?.trim() || error.message,
		);
	}

	const written = tracked(execFileSync).filter(
		(path) => !before.includes(path),
	);

	return { kind, slug, section: section ?? null, written, log: log.trim() };
}

/** Every file git can see, tracked or not, ignoring what it is told to ignore. */
function tracked(execFileSync) {
	return execFileSync(
		"git",
		["ls-files", "--cached", "--others", "--exclude-standard"],
		{
			cwd: root,
			encoding: "utf8",
		},
	)
		.split("\n")
		.filter(Boolean);
}

/* ── tools ───────────────────────────────────────────────────────────── */

export function registerAuthoringTools(server) {
	/*
	 * The write half. Everything above this line reads; these six add to the
	 * site, and each one leaves the repository in a state `pnpm run doctor`
	 * can check - which is what makes this safe to hand to an agent. Nothing
	 * here fills in a summary or a description: a scaffold that writes
	 * placeholder prose produces a file that looks finished and is not, and
	 * the doctor can no longer tell the difference.
	 */
	for (const [name, kind, about] of CREATES) {
		server.registerTool(
			name,
			{
				title: name,
				description: `${about} Writes the files that are the same every time, from templates/, and stops. The parts that carry meaning - a summary, a description, a demo - are left empty on purpose, and \`pnpm run doctor\` fails until they are written.`,
				inputSchema: z.object({
					slug: z
						.string()
						.describe(
							"Lowercase, digits and single hyphens. It becomes a URL and a filename.",
						),
					...(kind === "docs"
						? {
								section: z
									.string()
									.describe("index, get-started, guides, api or examples."),
							}
						: {}),
				}),
			},
			async ({ slug, section }) => {
				const result = await create(kind, slug, section);
				return {
					...text(
						[
							`${kind} "${slug}" created.`,
							"",
							...result.written.map((path) => `    ${path}`),
							"",
							result.log,
						]
							.filter(Boolean)
							.join("\n"),
					),
					structuredContent: result,
				};
			},
		);
	}

	server.registerTool(
		"list-slugs",
		{
			title: "List every published path",
			description:
				"Every path this site serves, read from the sitemap it generates rather than from a list. Use it before adding a page, renaming one, or claiming a URL exists.",
			inputSchema: z.object({
				origin: z
					.string()
					.optional()
					.describe(
						"Where the site is running. Tries localhost:3000 then adamjurek.com.",
					),
				section: z
					.string()
					.optional()
					.describe("Only this first segment, e.g. /components."),
			}),
		},
		async ({ origin, section }) => {
			let paths;
			let source;

			for (const candidate of origin ? [origin] : ORIGINS) {
				try {
					paths = await fromSitemap(candidate);
					source = candidate;
					break;
				} catch {
					// Next origin, then the repo. A site that is not running is the
					// ordinary case on a laptop, not an error worth reporting.
				}
			}

			if (!paths) {
				paths = fromRepo();
				source = "the repository (nothing is serving a sitemap)";
			}

			const filtered = section
				? paths.filter(
						(path) => path === section || path.startsWith(`${section}/`),
					)
				: paths;

			const lines = [`${filtered.length} paths, from ${source}.`, ""];
			for (const [key, mine] of group(filtered)) {
				lines.push(`${key}  (${mine.length})`);
				for (const path of mine.sort()) lines.push(`    ${path}`);
				lines.push("");
			}

			return {
				...text(lines.join("\n").trimEnd()),
				structuredContent: { source, total: filtered.length, paths: filtered },
			};
		},
	);

	server.registerTool(
		"list-templates",
		{
			title: "List templates",
			description:
				"Every template `pnpm new` can write from, where each one lands, and which tokens it takes. A template is a working preview of its own output.",
			inputSchema: z.object({}),
		},
		async () => {
			const templates = readdirSync(TEMPLATES)
				.filter((name) => name.endsWith(".md") && name !== "README.md")
				.map((name) => name.replace(/\.md$/, ""))
				.map((name) => {
					try {
						const { header } = loadTemplate(name);
						return { name, target: header.target, tokens: header.tokens ?? "" };
					} catch (error) {
						// A template with no header goes nowhere, and saying so is more
						// useful than leaving it out of the list entirely.
						return { name, target: null, error: error.message };
					}
				});

			return {
				...text(
					templates
						.map((one) =>
							one.target
								? `${one.name.padEnd(26)} ${one.target}\n${" ".repeat(27)}tokens: ${one.tokens || "none"}`
								: `${one.name.padEnd(26)} ${one.error}`,
						)
						.join("\n"),
				),
				structuredContent: { templates },
			};
		},
	);

	server.registerTool(
		"read-template",
		{
			title: "Read a template",
			description:
				"One template, rendered as it sits on disk with its header stripped. Read it before writing the file by hand, so the new file matches every other one of its kind.",
			inputSchema: z.object({
				name: z
					.string()
					.describe("Template name from list-templates, e.g. post"),
			}),
		},
		async ({ name }) => {
			const { header, body } = loadTemplate(name);
			return {
				...text(
					`# templates/${name}.md\n\ngoes to: ${header.target}\ntokens: ${header.tokens ?? "none"}\n\n---\n\n${body}`,
				),
				structuredContent: { name, ...header },
			};
		},
	);

	server.registerTool(
		"plan-slug-change",
		{
			title: "Plan a slug change",
			description:
				"Everything that would have to change to rename a slug: the files that carry it in their path, and every line in the repository that mentions it. Read-only. Renaming a component touches its source, its registry entry, its barrel export, its demo and five documents, so the plan is the useful artefact and `pnpm run doctor` is what proves the change landed.",
			inputSchema: z.object({
				from: z.string().describe("The slug as it is now, e.g. desk-window"),
				to: z
					.string()
					.optional()
					.describe("What it would become. Only used to phrase the plan."),
			}),
		},
		async ({ from, to }) => {
			if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(from)) {
				return text(
					`"${from}" is not a slug. Lowercase, digits and single hyphens.`,
				);
			}

			const { execFileSync } = await import("node:child_process");

			/*
			 * git grep, not a walk of my own: it already knows what is tracked and
			 * what is ignored, and a rename plan that lists a build artefact is a
			 * plan that sends somebody to edit a generated file.
			 */
			const mentions = execFileSync(
				"git",
				["grep", "-n", "--fixed-strings", "--", from],
				{ cwd: root, encoding: "utf8" },
			)
				.split("\n")
				.filter(Boolean);

			const files = execFileSync("git", ["ls-files"], {
				cwd: root,
				encoding: "utf8",
			})
				.split("\n")
				.filter((path) =>
					path
						.split("/")
						.some((part) => part === from || part.startsWith(`${from}.`)),
				);

			const lines = [
				to
					? `Renaming "${from}" to "${to}".`
					: `Everything that carries "${from}".`,
				"",
				`Paths to move  (${files.length})`,
				...files.map((path) => `    ${path}`),
				"",
				`Lines to change  (${mentions.length})`,
				...mentions.slice(0, 80).map((hit) => `    ${hit}`),
				mentions.length > 80 ? `    ... and ${mentions.length - 80} more` : "",
				"",
				"Then: pnpm run doctor, which fails on a registry entry without files,",
				"a doc without a registry item, and an export nothing registers.",
			];

			return {
				...text(lines.filter((line) => line !== "").join("\n")),
				structuredContent: {
					from,
					to: to ?? null,
					files,
					mentions: mentions.length,
				},
			};
		},
	);
}
