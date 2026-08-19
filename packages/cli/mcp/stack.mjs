/*
 * The stack server: what our dependencies can do, without leaving the machine.
 *
 * `pnpm sushindustries refs` fetches each provider's llms.txt once and shards
 * it into JSON. This searches those shards, so finding the right documentation
 * page costs a file read rather than a round trip, and still works with no
 * network at all.
 *
 * It returns links, titles, sections and the provider's own one-line
 * descriptions. Never page content. Their prose stays on their servers; what
 * we keep is the map, which is the half that tells you which page to open.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { parseStack, REFERENCES, STACK } from "../lib/context.mjs";
import { text } from "./core.mjs";

const load = (file) => JSON.parse(readFileSync(join(REFERENCES, file), "utf8"));

/**
 * The manifest: every provider and every section, and not one entry.
 *
 * Read first by all three tools, because it answers "what exists" without
 * loading any of it. Nine thousand entries live behind this file and none of
 * them are opened until something asks for a section by name.
 */
function manifest() {
	try {
		return load("index.json");
	} catch {
		return null;
	}
}

/** The entries of the named shards, and only those. */
function entriesOf(sections) {
	return sections.flatMap((section) => load(section.file).entries);
}

const EMPTY = "No shards yet. Run: pnpm sushindustries refs";

export function registerStackTools(server) {
	server.registerTool(
		"list-stack",
		{
			title: "List the stack",
			description:
				"Everything this repository depends on, what each is used for here, and which version is installed. The `for` line is the part a lockfile never records: why this choice, in this repo.",
			inputSchema: z.object({
				purpose: z
					.string()
					.optional()
					.describe("interface, three-d, server, data, toolchain or testing."),
			}),
		},
		async ({ purpose }) => {
			const items = parseStack(readFileSync(STACK, "utf8")).filter(
				(item) => !purpose || item.purpose === purpose,
			);

			if (!items.length) return text(`Nothing in the stack for "${purpose}".`);

			const lines = [];
			for (const group of [...new Set(items.map((item) => item.purpose))]) {
				lines.push(`${group}`);
				for (const item of items.filter((one) => one.purpose === group)) {
					lines.push(
						`  ${item.name}${item.version ? ` ${item.version}` : ""}`,
						`    ${item.for}`,
						`    ${item.docs}${item.llms ? "  (indexed)" : ""}`,
					);
				}
				lines.push("");
			}

			return {
				...text(lines.join("\n").trimEnd()),
				structuredContent: { items },
			};
		},
	);

	server.registerTool(
		"list-providers",
		{
			title: "List providers",
			description:
				"Every dependency whose documentation index is sharded locally: what it is used for here, how many entries it has, and when it was fetched. Start here, then narrow.",
			inputSchema: z.object({}),
		},
		async () => {
			const index = manifest();
			if (!index) return text(EMPTY);

			const providers = index.providers.map((one) => ({
				provider: one.provider,
				title: one.title,
				entries: one.total,
				shards: one.sections.length,
				usedFor: one.usedFor,
				parent: one.parent ?? null,
				fetchedAt: one.fetchedAt,
			}));

			/*
			 * Children fold under the provider they came from, which is also the
			 * truth about them: TanStack Router's index is part of TanStack's, not
			 * a peer of it. Printed flat, thirty shards is a wall nobody reads.
			 */
			const roots = providers
				.filter((one) => !one.parent)
				.sort((a, b) => b.entries - a.entries);

			const lines = [];
			for (const parent of roots) {
				const children = providers
					.filter((one) => one.parent === parent.provider)
					.sort((a, b) => b.entries - a.entries);
				const total =
					parent.entries + children.reduce((sum, one) => sum + one.entries, 0);

				lines.push(
					`${parent.provider}  ${total} entries  ${parent.usedFor.join(", ")}`,
				);
				if (children.length) {
					lines.push(
						`    ${children
							.map(
								(one) =>
									`${one.provider.replace(`${parent.provider}-`, "")} (${one.entries})`,
							)
							.join(", ")}`,
					);
				}
			}

			lines.push(
				"",
				`${providers.length} providers, ${providers.reduce((sum, one) => sum + one.shards, 0)} shards, ${providers.reduce((sum, one) => sum + one.entries, 0)} entries.`,
				"Narrow with find-reference { query, provider }.",
			);

			return { ...text(lines.join("\n")), structuredContent: { providers } };
		},
	);

	server.registerTool(
		"list-sections",
		{
			title: "List a provider's sections",
			description:
				"The sections of one provider's documentation, with how many pages each holds. Use it to narrow a search before running find-reference.",
			inputSchema: z.object({
				provider: z
					.string()
					.describe("Provider slug from list-providers, e.g. tanstack-com"),
			}),
		},
		async ({ provider }) => {
			const index = manifest();
			if (!index) return text(EMPTY);

			const found = index.providers.find((one) => one.provider === provider);
			if (!found)
				return text(`No shard for "${provider}". Try list-providers.`);

			// Straight off the manifest. Counting a section should never mean
			// opening the entries being counted.
			const sections = found.sections
				.slice()
				.sort((a, b) => b.entries - a.entries);

			return {
				...text(
					sections
						.map(
							(one) =>
								`${String(one.entries).padStart(4)}  ${one.name.padEnd(32)} ${one.file}`,
						)
						.join("\n"),
				),
				structuredContent: { provider, sections },
			};
		},
	);

	server.registerTool(
		"find-reference",
		{
			title: "Find a documentation page",
			description:
				"Search every sharded provider index and return matching pages with their URLs. This is the fast way to find the right documentation page before reading it, and it is cheaper than guessing an API that may have changed.",
			inputSchema: z.object({
				query: z.string().describe("What to look for. Case-insensitive."),
				provider: z
					.string()
					.optional()
					.describe("Narrow to one provider, e.g. orm-drizzle-team"),
				section: z.string().optional().describe("Narrow to one section."),
				limit: z.number().int().positive().max(50).optional(),
			}),
		},
		async ({ query, provider, section, limit = 20 }) => {
			const index = manifest();
			if (!index) return text(EMPTY);

			const needle = query.toLowerCase();
			const matches = [];

			/*
			 * Only the shards the arguments leave standing are opened. A search
			 * narrowed to one provider's guides reads one file of a few hundred
			 * entries; the same search unnarrowed reads all of them, which is the
			 * honest cost of asking a vague question.
			 */
			for (const one of index.providers) {
				if (provider && one.provider !== provider) continue;

				const wanted = one.sections.filter(
					(each) => !section || each.name === section,
				);
				for (const entry of entriesOf(wanted)) {
					const haystack =
						`${entry.name} ${entry.description} ${entry.section} ${entry.url}`.toLowerCase();
					if (haystack.includes(needle))
						matches.push({ ...entry, provider: one.provider });
				}
			}

			// A name match is what was meant far more often than a description
			// match, so those come first rather than in file order.
			matches.sort((a, b) => {
				const rank = (one) => (one.name.toLowerCase().includes(needle) ? 0 : 1);
				return rank(a) - rank(b);
			});

			const top = matches.slice(0, limit);
			const more =
				matches.length > top.length
					? `\n\n(${matches.length - top.length} more - narrow with provider or section)`
					: "";

			return {
				...text(
					top.length
						? top
								.map(
									(one) =>
										`${one.provider} · ${one.section}\n  ${one.name}\n  ${one.url}${one.description ? `\n  ${one.description}` : ""}`,
								)
								.join("\n\n") + more
						: `Nothing matches "${query}". Try list-providers to see what is sharded.`,
				),
				structuredContent: { total: matches.length, matches: top },
			};
		},
	);
}
