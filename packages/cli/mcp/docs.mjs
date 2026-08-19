/*
 * The documentation server. Reads what is written here, and what it describes.
 *
 * Everything it serves is already in the repository, so there is no second
 * copy to go stale. What it adds is the shape: this repo's documentation is
 * not a pile of files, it is a component page split into five sections, and a
 * server that hands back "button" when you wanted the API is a server you have
 * to read around.
 *
 * It reads the source too, because half of every real question is in the
 * implementation. The API section says a prop exists; the source says what
 * happens when you pass the wrong thing. When the two disagree the source is
 * right, and having both behind one server is what makes that findable.
 *
 * The five sections are the tabs the site renders - index, get-started,
 * guides, api, examples - so `read-doc { slug: "card", section: "api" }` is
 * the same shard the page shows under the API tab, and a question about props
 * costs one call and one section instead of a whole document.
 */

import { z } from "zod";
import { bytes, readRepo, text, walk } from "./core.mjs";

/*
 * Where documentation lives, and what each kind is called.
 *
 * A path decides the kind, so nothing here is a list that has to be kept in
 * step with the repository. Adding a package adds its README to `package`
 * without anybody editing this file, which is the only version of this that
 * stays true.
 */
const KINDS = [
	{
		kind: "component",
		about:
			"One directory per element, split into the five tabs the site renders.",
		match: (path) => /^packages\/[^/]+\/docs\/[^/]+\/[^/]+\.md$/.test(path),
	},
	{
		kind: "package",
		about:
			"The README of each installable package. What it is and how to install it.",
		match: (path) => /^packages\/[^/]+\/README\.md$/.test(path),
	},
	{
		kind: "post",
		about: "Written pieces. The reasoning behind a decision, after the fact.",
		match: (path) => path.startsWith("apps/web/content/posts/"),
	},
	{
		kind: "page",
		about:
			"Standing pages: about, contact, privacy, cookies, the API description.",
		match: (path) => path.startsWith("apps/web/content/pages/"),
	},
	{
		kind: "desk",
		about: "The desktop at /, and what is arranged on it.",
		match: (path) => path.startsWith("apps/web/content/desks/"),
	},
	/*
	 * A skill is a SKILL.md, and nothing else.
	 *
	 * `.claude/` also holds the rules a skill points at, the records of what was
	 * tested, the pipeline and the roadmap. Filing all of it as "skill" made the
	 * skill list mostly not-skills, and an index built over that list numbered
	 * things nobody can invoke.
	 */
	{
		kind: "skill",
		about: "One SKILL.md each: what to do, and when.",
		match: (path) => /^\.claude\/skills\/.+\/SKILL\.md$/.test(path),
	},
	{
		kind: "note",
		about:
			"What the skills point at: the rules, the references, and what was tested.",
		match: (path) => path.startsWith(".claude/"),
	},
	{
		kind: "repo",
		about:
			"The repository's own front matter: README, contributing, licence, security.",
		match: (path) => path.endsWith(".md"),
	},
	/*
	 * The code itself.
	 *
	 * A documentation server that cannot show the implementation is answering
	 * half of every question: the API section says a prop exists and the source
	 * says what it does when you pass the wrong thing. They also disagree
	 * sometimes, and the source is the one that is right - so being able to
	 * reach both in one server is what makes the disagreement findable rather
	 * than a bug somebody hits later.
	 *
	 * Only the published packages. The app's own wiring is not installable and
	 * not what anybody is asking about here.
	 */
	{
		kind: "source",
		about: "The implementation, for the packages that publish one.",
		match: (path) => /^packages\/[^/]+\/src\/.+\.(tsx?|css)$/.test(path),
	},
];

/** What a documentation server will read. Markdown, plus the source it describes. */
const READABLE = /\.(md|tsx?|css)$/;

/*
 * The kind a path belongs to, or nothing.
 *
 * Nothing is a real answer and has to be one. The walk reads every `.ts`,
 * `.tsx` and `.css` in the repository so it can pick up package source, but
 * only a package's own `src` is source anybody would install - the app's own
 * components are wiring for one site. Those match no kind, and returning
 * undefined for them is how they stay out rather than being filed under
 * whichever bucket happened to be last.
 */
const classify = (path) => KINDS.find((one) => one.match(path))?.kind;

/** Every readable file, with its kind and, for a component, its slug and section. */
export function index() {
	const found = [];

	for (const path of walk(".", (name) => READABLE.test(name))) {
		const kind = classify(path);
		if (!kind) continue;

		const component = path.match(
			/^packages\/[^/]+\/docs\/([^/]+)\/([^/]+)\.md$/,
		);

		found.push({
			path,
			kind,
			...(component ? { slug: component[1], section: component[2] } : {}),
			...(kind === "package" ? { slug: path.split("/")[1] } : {}),
			...(kind === "post" || kind === "page" || kind === "desk"
				? { slug: path.replace(/^.*\/(.+)\.md$/, "$1") }
				: {}),
			...(kind === "source"
				? { slug: path.replace(/^.*\/(.+)\.[a-z]+$/, "$1") }
				: {}),
		});
	}

	return found;
}

/**
 * Resolves a reference to one document.
 *
 * Three ways in, because there are three ways a caller knows what it wants:
 * by slug and section (from list-docs), by exact path (from search-docs), or
 * by a fragment somebody typed. The loose match is last so an exact path can
 * never be beaten by a substring of a different file.
 */
function locate({ path, slug, section }) {
	const all = index();

	if (slug) {
		const forSlug = all.filter((doc) => doc.slug === slug);
		if (!forSlug.length) throw new Error(`Nothing documented under "${slug}".`);

		if (!section) {
			// The overview, or whatever single document this slug has.
			return forSlug.find((doc) => doc.section === "index") ?? forSlug[0];
		}

		const found = forSlug.find((doc) => doc.section === section);
		if (!found) {
			const has = forSlug.map((doc) => doc.section).filter(Boolean);
			throw new Error(
				`"${slug}" has no ${section} section. It has: ${has.join(", ") || "no sections"}.`,
			);
		}
		return found;
	}

	if (!path)
		throw new Error("Give either a path, or a slug with an optional section.");

	const wanted = String(path).replace(/^\/+/, "");
	const found =
		all.find((doc) => doc.path === wanted) ??
		all.find((doc) => doc.path.endsWith(`/${wanted}`)) ??
		all.find((doc) => doc.path.toLowerCase().includes(wanted.toLowerCase()));

	if (!found) throw new Error(`No document matching "${path}".`);
	return found;
}

export function registerDocsTools(server) {
	server.registerTool(
		"list-docs",
		{
			title: "List documentation",
			description:
				"Every Markdown document in this repository, grouped by kind: component pages, package READMEs, posts, pages, desks, skills and the repo's own files. Narrow with kind or slug before reading anything.",
			inputSchema: z.object({
				kind: z
					.enum(KINDS.map((one) => one.kind))
					.optional()
					.describe("Only this kind."),
				slug: z
					.string()
					.optional()
					.describe("Only this component, package or post."),
			}),
		},
		async ({ kind, slug }) => {
			const docs = index().filter(
				(doc) => (!kind || doc.kind === kind) && (!slug || doc.slug === slug),
			);

			if (!docs.length) return text("Nothing matches that.");

			const lines = [];
			for (const group of KINDS) {
				const mine = docs.filter((doc) => doc.kind === group.kind);
				if (!mine.length) continue;

				lines.push(`${group.kind}  (${mine.length})`, `  ${group.about}`);

				/*
				 * Component docs collapse to one line per slug with its sections
				 * listed. Three hundred and forty five separate lines is a wall,
				 * and the useful fact is which tabs a component actually has.
				 *
				 * Asking for one slug is asking to choose between its sections, so
				 * that case prints the sizes too - which is the number that decides
				 * whether to read a section or the whole page.
				 */
				if (group.kind === "component") {
					if (slug) {
						for (const doc of mine) {
							lines.push(
								`    ${doc.section.padEnd(14)} ${String(bytes(doc.path)).padStart(6)} bytes  ${doc.path}`,
							);
						}
					} else {
						for (const one of [
							...new Set(mine.map((doc) => doc.slug)),
						].sort()) {
							const sections = mine
								.filter((doc) => doc.slug === one)
								.map((doc) => doc.section)
								.join(", ");
							lines.push(`    ${one.padEnd(24)} ${sections}`);
						}
					}
				} else {
					for (const doc of mine) lines.push(`    ${doc.path}`);
				}
				lines.push("");
			}

			return {
				...text(lines.join("\n").trimEnd()),
				structuredContent: { total: docs.length, docs },
			};
		},
	);

	server.registerTool(
		"read-doc",
		{
			title: "Read a document",
			description:
				"One document, whole. Address it either by slug and section (slug: 'card', section: 'api') or by path, exact or partial. Reading one section is the cheap way to answer a question about props or usage.",
			inputSchema: z.object({
				slug: z
					.string()
					.optional()
					.describe("Component, package or post slug."),
				section: z
					.string()
					.optional()
					.describe(
						"index, get-started, guides, api or examples. Defaults to index.",
					),
				path: z
					.string()
					.optional()
					.describe("Path instead of a slug. Exact or partial."),
			}),
		},
		async (reference) => {
			const doc = locate(reference);
			return {
				...text(`# ${doc.path}\n\n${readRepo(doc.path)}`),
				structuredContent: doc,
			};
		},
	);

	server.registerTool(
		"search-docs",
		{
			title: "Search documentation",
			description:
				"Which documents mention a phrase, with the matching lines. Run this before read-doc whenever you do not already know where something is written down.",
			inputSchema: z.object({
				query: z.string().describe("Text to look for. Case-insensitive."),
				kind: z.enum(KINDS.map((one) => one.kind)).optional(),
				section: z
					.string()
					.optional()
					.describe("Only this section of component pages."),
				limit: z.number().int().positive().max(100).optional(),
			}),
		},
		async ({ query, kind, section, limit = 30 }) => {
			const needle = query.toLowerCase();
			const hits = [];

			for (const doc of index()) {
				if (kind && doc.kind !== kind) continue;
				if (section && doc.section !== section) continue;
				if (hits.length >= limit) break;

				const lines = readRepo(doc.path).split("\n");
				for (const [offset, line] of lines.entries()) {
					if (hits.length >= limit) break;
					if (!line.toLowerCase().includes(needle)) continue;
					hits.push({
						path: doc.path,
						slug: doc.slug,
						section: doc.section,
						line: offset + 1,
						excerpt: line.trim().slice(0, 200),
					});
				}
			}

			return {
				...text(
					hits.length
						? hits
								.map((hit) => `${hit.path}:${hit.line}\n  ${hit.excerpt}`)
								.join("\n\n")
						: `Nothing mentions "${query}".`,
				),
				structuredContent: { hits },
			};
		},
	);
}
