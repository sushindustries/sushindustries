import { parseFrontmatter, readString } from "@sushindustries/ui";
import { type Insight, insight as insightSchema } from "./insights.schemas";

/*
 * Insights, from `content/insights/*.md`.
 *
 * The same build-time approach as collections, and the same split: what is
 * inlined here is the *question*, and the answer is a query run when somebody
 * asks. That is why this is a `.catalogue.ts` with a `.server.ts` beside it -
 * "what insights exist" needs no database and "what does this one say" does.
 *
 * A definition that does not parse is dropped rather than thrown. An insight
 * naming a metric that does not exist is a file somebody typed wrong, and the
 * right answer is that it does not appear - throwing would take the site's
 * build down over one Markdown file.
 */

const FILES = import.meta.glob<string>("../../../../content/insights/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

const idFromPath = (path: string) =>
	path.split("/").at(-1)?.replace(/\.md$/, "") ?? "";

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { frontmatter: "", body: raw };
	return { frontmatter: match[1] ?? "", body: raw.slice(match[0].length) };
}

function toInsight(path: string, raw: string): Insight | undefined {
	const id = idFromPath(path);
	if (!id) return undefined;

	const { frontmatter, body } = splitFrontmatter(raw);
	const meta = parseFrontmatter(frontmatter);

	const parsed = insightSchema.safeParse({
		id,
		path: `apps/web/content/insights/${id}.md`,
		title: readString(meta, "title", id),
		summary: readString(meta, "summary"),
		metric: readString(meta, "metric"),
		limit: readString(meta, "limit") || undefined,
		as: readString(meta, "as") || undefined,
		draft: readString(meta, "draft") === "true",
		body: body.trim(),
	});

	return parsed.success ? parsed.data : undefined;
}

const INSIGHTS: readonly Insight[] = Object.entries(FILES)
	.map(([path, raw]) => toInsight(path, raw))
	.filter((one): one is Insight => Boolean(one))
	.sort((a, b) => a.title.localeCompare(b.title));

export function listInsights(): readonly Insight[] {
	return INSIGHTS.filter((one) => !one.draft);
}

/** One by id, drafts included - the same contract a draft post has. */
export function findInsight(id: string): Insight | undefined {
	return INSIGHTS.find((one) => one.id === id);
}
