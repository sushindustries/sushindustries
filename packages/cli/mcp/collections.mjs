/*
 * Collections: saved queries over the documents in this repository.
 *
 * The fourth group, and the one an agent should reach for first. `list-docs`
 * answers "what is here" with several hundred paths, which is the correct
 * answer and an unusable one - a context window spent listing files has
 * nothing left for reading them. A collection is somebody's judgement about
 * which of those paths belong together, with the price of the whole set
 * attached, so the decision "should I read this" can be made before paying
 * for it.
 *
 * The important property is that a collection is a *filter*, not a list. It
 * is defined by frontmatter in `content/collections/*.md` - a kind, a section,
 * a search - and membership is worked out when somebody asks. A document
 * added next week joins every collection it matches with nothing edited, and
 * a collection can never be quietly three files out of date.
 *
 * Read from the repository rather than from the database, deliberately. The
 * graph has the same collections and answers them from the projection, which
 * is better when it is fresh and unavailable when there is no DATABASE_URL -
 * and this server's whole promise is that it works from a checkout with
 * nothing running. The counts here are over files on disk, which is the
 * newest possible answer.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { root } from "../lib/context.mjs";
import { readRepo, text } from "./core.mjs";
import { index } from "./docs.mjs";

const DEFINITIONS = join(root, "apps/web/content/collections");

/** Four characters to a token, the same estimate the projection stores. */
const tokensIn = (body) => Math.ceil(body.length / 4);

/**
 * The frontmatter, as a flat map.
 *
 * A deliberately small parser: `key: value` and nothing else. A collection's
 * frontmatter is six scalar fields, and pulling in a YAML dependency to read
 * six scalars would be the largest thing in this package by an order of
 * magnitude. Anything that needs more structure than this is a collection
 * that should have been prose.
 */
function frontmatter(raw) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { meta: {}, body: raw };

	const meta = {};
	for (const line of match[1].split("\n")) {
		if (line.startsWith("#")) continue;
		const at = line.indexOf(":");
		if (at === -1) continue;

		const value = line.slice(at + 1).trim();
		if (value) meta[line.slice(0, at).trim()] = value;
	}

	return { meta, body: raw.slice(match[0].length) };
}

/** Every collection defined in the repository. */
function definitions() {
	if (!existsSync(DEFINITIONS)) return [];

	return readdirSync(DEFINITIONS)
		.filter((name) => name.endsWith(".md"))
		.map((name) => {
			const id = name.replace(/\.md$/, "");
			const { meta, body } = frontmatter(
				readFileSync(join(DEFINITIONS, name), "utf8"),
			);

			return {
				id,
				path: `apps/web/content/collections/${name}`,
				title: meta.title ?? id,
				summary: meta.summary ?? "",
				kind: meta.kind,
				section: meta.section,
				search: meta.search,
				sort: meta.sort ?? "path",
				direction: meta.direction ?? "asc",
				limit: Number(meta.limit ?? 50),
				draft: meta.draft === "true",
				body: body.trim(),
			};
		})
		.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Every indexable document, with its cost and enough of it to search.
 *
 * `index()` from `docs.mjs` decides what counts as a document and what kind it
 * is - reusing it rather than reimplementing the classifier is the point. A
 * collection filtering on `kind=skill` and `list-docs` filtering on the same
 * word have to mean the same thing, and the only way to guarantee that is for
 * one function to answer both.
 *
 * Bodies are read here, which is the expensive part and is why nothing caches
 * it: this server is a short-lived process answering one question, and a cache
 * across calls it does not live long enough to make would only ever be stale.
 */
function corpus() {
	return index().map((doc) => {
		const raw = readRepo(doc.path) ?? "";
		const { meta, body } = frontmatter(raw);

		return {
			path: doc.path,
			kind: doc.kind,
			slug: doc.slug ?? null,
			// A component's five documents share a slug and differ by section,
			// which is the one shape a filter needs to be able to address.
			section: doc.section ?? null,
			title: meta.title ?? doc.slug ?? doc.path,
			summary: meta.summary ?? "",
			tokens: tokensIn(raw),
			body,
		};
	});
}

/** Runs one collection's filter over the corpus. */
function membersOf(collection, all) {
	const needle = collection.search?.toLowerCase();

	const matched = all.filter((one) => {
		if (collection.kind && one.kind !== collection.kind) return false;
		if (collection.section && one.section !== collection.section) return false;
		if (
			needle &&
			!`${one.title} ${one.summary} ${one.path} ${one.body}`
				.toLowerCase()
				.includes(needle)
		) {
			return false;
		}
		return true;
	});

	const key =
		collection.sort === "tokens"
			? (one) => one.tokens
			: collection.sort === "title"
				? (one) => one.title
				: (one) => one.path;

	matched.sort((a, b) => {
		const left = key(a);
		const right = key(b);
		const order =
			typeof left === "number" && typeof right === "number"
				? left - right
				: String(left).localeCompare(String(right));
		return collection.direction === "desc" ? -order : order;
	});

	return matched;
}

export async function registerCollectionsTools(server) {
	server.registerTool(
		"list-collections",
		{
			title: "List collections",
			description:
				"Every named set of documents in this repository, with how many files are in it and what the whole set costs to read. Start here rather than with list-docs: this is the map somebody drew on purpose, and the token count is what decides whether a set is worth loading. A collection is a saved filter, so these counts are computed now and are never out of date.",
			inputSchema: z.object({}),
		},
		async () => {
			const all = corpus();
			const listed = definitions()
				.filter((one) => !one.draft)
				.map((one) => {
					const members = membersOf(one, all);
					return {
						...one,
						total: members.length,
						tokens: members.reduce((sum, member) => sum + member.tokens, 0),
					};
				})
				.sort((a, b) => b.total - a.total);

			if (listed.length === 0) {
				return text(
					"No collections yet. `create-collection <slug>` writes one from the template.",
				);
			}

			return {
				...text(
					[
						"# Collections",
						"",
						...listed.map((one) =>
							[
								`## ${one.title}  (${one.id})`,
								one.summary,
								`${one.total} documents · ${one.tokens.toLocaleString()} tokens`,
								`filter: ${
									[
										one.kind && `kind=${one.kind}`,
										one.section && `section=${one.section}`,
										one.search && `search=${one.search}`,
									]
										.filter(Boolean)
										.join(" ") || "everything"
								}`,
							].join("\n"),
						),
					].join("\n\n"),
				),
				structuredContent: {
					collections: listed.map(({ body: _body, ...rest }) => rest),
				},
			};
		},
	);

	server.registerTool(
		"read-collection",
		{
			title: "Read a collection",
			description:
				"One collection: what it is for, and every document currently in it with its path and token cost. Returns the list, never the bodies - read the members you want with read-doc, which is the point of getting the costs first.",
			inputSchema: z.object({
				id: z
					.string()
					.describe("The collection's id, from list-collections, e.g. skills"),
				full: z
					.boolean()
					.optional()
					.describe(
						"Ignore the collection's own limit and list every match. Off by default, because a collection capped at fifty was capped on purpose.",
					),
			}),
		},
		async ({ id, full }) => {
			const found = definitions().find((one) => one.id === id);
			if (!found) {
				return text(
					`No collection called "${id}". \`list-collections\` has the ids.`,
				);
			}

			const matched = membersOf(found, corpus());
			const shown = full ? matched : matched.slice(0, found.limit);
			const tokens = matched.reduce((sum, member) => sum + member.tokens, 0);

			return {
				...text(
					[
						`# ${found.title}`,
						"",
						found.summary,
						"",
						`${matched.length} documents · ${tokens.toLocaleString()} tokens total`,
						matched.length > shown.length
							? `showing ${shown.length}; pass full: true for the rest`
							: "",
						"",
						found.body,
						"",
						"## Members",
						"",
						...shown.map(
							(member) =>
								`${String(member.tokens).padStart(6)}  ${member.path}`,
						),
					]
						.filter((line) => line !== "")
						.join("\n"),
				),
				structuredContent: {
					id: found.id,
					title: found.title,
					total: matched.length,
					tokens,
					members: shown.map(({ body: _body, ...rest }) => rest),
				},
			};
		},
	);
}
