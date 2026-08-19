import { McpServer } from "@modelcontextprotocol/server";
import {
	estimateTokens,
	parseDoc,
	type SiteEntry,
	withinBudget,
} from "@sushindustries/llms";
import { z } from "zod";
import { siteSections } from "./site-index";

/*
 * This site, as tools an agent can call over the network.
 *
 * The same index that produces llms.txt, the sitemap and the Markdown
 * mirrors, exposed a third way. That is the entire design: an agent that can
 * call `read-doc` gets the identical bytes a crawler gets from
 * `/components/card/api.md`, because both read `siteSections()`.
 *
 * Read-only, and that is not a limitation to fix later. The tools that write
 * live in the CLI, where they run against a checkout with git underneath them.
 * Here there is no checkout - the deployed image carries the built server and
 * nothing else - so a `create-post` on this side would write into a container
 * filesystem that disappears on the next deploy.
 *
 * `.server.ts` because it reads the environment and is only ever reached from
 * a server route.
 */

/** Every entry, flattened, with the section it came from. */
function entries(): (SiteEntry & { section: string })[] {
	return siteSections().flatMap((section) =>
		section.entries.map((entry) => ({ ...entry, section: section.title })),
	);
}

function locate(path: string): (SiteEntry & { section: string }) | undefined {
	const wanted = `/${String(path).replace(/^\/+/, "").replace(/\/+$/, "")}`;
	const all = entries();

	return (
		all.find((entry) => entry.path === wanted) ??
		all.find((entry) => entry.path.endsWith(wanted)) ??
		all.find((entry) => entry.path.toLowerCase().includes(wanted.toLowerCase()))
	);
}

/*
 * How large a single reply may get.
 *
 * Set against what a caller is actually doing here, which is reading one page
 * to answer one question. Twelve thousand tokens is several times the largest
 * document on this site, so nothing legitimate hits it - and a reply that does
 * hit it is a sign the request was too broad, which is exactly what the note
 * says when it fires.
 */
const MAX_TOKENS = 12_000;

const text = (value: string, advice?: string) => {
	const fitted = withinBudget(
		value,
		MAX_TOKENS,
		advice ?? "Narrow the request and ask again.",
	);
	return { content: [{ type: "text" as const, text: fitted.text }] };
};

export function siteServer(): McpServer {
	const server = new McpServer({ name: "sushindustries", version: "0.1.0" });

	server.registerTool(
		"list-docs",
		{
			title: "List everything published",
			description:
				"Every page this site serves, grouped as the site groups them: components, packages, writing and standalone pages. Each line is a path, a title and one sentence. Start here.",
			inputSchema: z.object({
				section: z
					.string()
					.optional()
					.describe("Components, Packages, Writing or Pages."),
			}),
		},
		async ({ section }) => {
			const all = entries().filter(
				(entry) =>
					!section || entry.section.toLowerCase() === section.toLowerCase(),
			);

			const lines: string[] = [];
			for (const group of [...new Set(all.map((entry) => entry.section))]) {
				lines.push(`${group}`);
				for (const entry of all.filter((one) => one.section === group)) {
					lines.push(
						`  ${entry.path}`,
						`    ${entry.title} - ${entry.description ?? ""}`,
					);
				}
				lines.push("");
			}

			return {
				...text(lines.join("\n").trimEnd() || "Nothing matches that section."),
				structuredContent: { total: all.length },
			};
		},
	);

	server.registerTool(
		"read-doc",
		{
			title: "Read one page",
			description:
				"One page's Markdown, or just the part of it you asked for. Passing `heading` returns that section alone, which is how to answer a question about props or installation without pulling nine kilobytes to find three lines.",
			inputSchema: z.object({
				path: z
					.string()
					.describe(
						"Site path, e.g. /components/card or /posts/adding-things.",
					),
				heading: z
					.string()
					.optional()
					.describe(
						"Return only this section. Matched loosely against the headings.",
					),
			}),
		},
		async ({ path, heading }) => {
			const entry = locate(path);
			if (!entry) return text(`Nothing published at "${path}". Try list-docs.`);
			if (!entry.body) {
				return text(
					`${entry.path}\n\n${entry.title}\n${entry.description ?? ""}\n\n(No body published for this page.)`,
				);
			}

			const parsed = parseDoc(entry.body);

			if (heading) {
				const needle = heading.toLowerCase();
				const found = parsed.headings.find((one) =>
					one.title.toLowerCase().includes(needle),
				);
				if (!found) {
					return text(
						`"${entry.path}" has no heading matching "${heading}". It has: ${parsed.headings.map((one) => one.title).join(", ")}`,
					);
				}
				return {
					...text(`# ${entry.path} - ${found.title}\n\n${found.body}`),
					structuredContent: { path: entry.path, heading: found.title },
				};
			}

			return {
				...text(
					`# ${entry.path}\n\n${entry.body}`,
					`Ask for one section instead: read-doc { path: "${entry.path}", heading: "..." }. Its headings are ${parsed.headings.map((one) => one.title).join(", ")}.`,
				),
				structuredContent: {
					path: entry.path,
					title: parsed.title,
					summary: parsed.summary,
					words: parsed.words,
					tokens: estimateTokens(entry.body),
					headings: parsed.headings.map((one) => one.title),
				},
			};
		},
	);

	server.registerTool(
		"outline-doc",
		{
			title: "Outline one page",
			description:
				"What a page contains without its text: its headings, its code examples and the pages it links to. Read this first when you do not know which part of a page answers the question.",
			inputSchema: z.object({
				path: z.string().describe("Site path, e.g. /components/card."),
			}),
		},
		async ({ path }) => {
			const entry = locate(path);
			if (!entry?.body)
				return text(`No body published at "${path}". Try list-docs.`);

			const parsed = parseDoc(entry.body);
			const lines = [
				`${entry.path}  ${parsed.words} words, about ${estimateTokens(entry.body).toLocaleString()} tokens`,
				parsed.summary ? `  ${parsed.summary}` : "",
				"",
				"Headings",
				...parsed.headings.map(
					(one) => `  ${"  ".repeat(one.level - 1)}${one.title}`,
				),
				"",
				`Code examples  (${parsed.fences.length})`,
				...[...new Set(parsed.fences.map((one) => one.language))].map(
					(language) =>
						`  ${language} x${parsed.fences.filter((one) => one.language === language).length}`,
				),
				"",
				`Links out  (${parsed.links.length})`,
				...parsed.links.slice(0, 20).map((link) => `  ${link}`),
			];

			return {
				...text(lines.filter((line) => line !== "").join("\n")),
				structuredContent: {
					path: entry.path,
					words: parsed.words,
					headings: parsed.headings.map((one) => one.title),
					fences: parsed.fences.length,
					links: parsed.links,
				},
			};
		},
	);

	server.registerTool(
		"search-docs",
		{
			title: "Search everything published",
			description:
				"Which pages mention a phrase, and where in each. Searches titles, descriptions and the full text. Run this before read-doc when you do not know which page holds the answer.",
			inputSchema: z.object({
				query: z.string().describe("Text to look for. Case-insensitive."),
				limit: z.number().int().positive().max(50).optional(),
			}),
		},
		async ({ query, limit = 20 }) => {
			const needle = query.toLowerCase();
			const hits: { path: string; title: string; where: string }[] = [];

			for (const entry of entries()) {
				if (hits.length >= limit) break;

				const inTitle = `${entry.title} ${entry.description ?? ""}`
					.toLowerCase()
					.includes(needle);

				if (inTitle) {
					hits.push({
						path: entry.path,
						title: entry.title,
						where: entry.description ?? "",
					});
					continue;
				}

				if (!entry.body?.toLowerCase().includes(needle)) continue;

				// The line it appears on, so the caller can judge relevance
				// without a second call for the whole page.
				const line = entry.body
					.split("\n")
					.find((each) => each.toLowerCase().includes(needle));
				hits.push({
					path: entry.path,
					title: entry.title,
					where: (line ?? "").trim().slice(0, 180),
				});
			}

			return {
				...text(
					hits.length
						? hits
								.map((hit) => `${hit.path}\n  ${hit.title}\n  ${hit.where}`)
								.join("\n\n")
						: `Nothing published mentions "${query}".`,
				),
				structuredContent: { hits },
			};
		},
	);

	return server;
}
