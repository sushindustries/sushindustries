import { z } from "zod";

/*
 * An insight is a named question with one answer.
 *
 * The Insights page was two panels of whatever the report happened to compute,
 * which meant "what does this tell me" had no answer that was not "read all of
 * it". Splitting them the way collections split browsing is the same move for
 * the same reason: a named thing can be linked to, asked for over MCP, queried
 * in the graph, and left out when it is not what you came for.
 *
 * The shape deliberately mirrors a collection. A collection is a saved filter
 * over documents; an insight is a saved *question* over the same rows. Both
 * are Markdown in `content/`, both carry their definition in frontmatter, both
 * are computed when asked. Somebody who has understood one understands the
 * other, which is worth more than either being individually optimal.
 *
 * What an insight is not: a chart. The metric produces labelled numbers and
 * the surface decides whether that is a chart, a table or a sentence - so the
 * same insight answers a person on a page and an agent over MCP without either
 * getting the other's format.
 */

/**
 * The computations an insight can name.
 *
 * A closed set, and it has to be: an insight is authored in Markdown by
 * somebody who is not writing SQL, so the metric is a word that maps to a
 * query written here. An open set would mean a query language in frontmatter,
 * which is a database with a worse syntax.
 */
export const METRICS = [
	"tokens-by-kind",
	"documents-by-kind",
	"most-viewed",
	"heaviest",
	"staleness",
	"orphans",
	"undocumented",
	"sections-missing",
] as const;

export type Metric = (typeof METRICS)[number];

export const insight = z.object({
	id: z.string().min(1).max(64),
	title: z.string().min(1).max(120),
	summary: z.string().max(400).default(""),

	metric: z.enum(METRICS),

	/** How many rows to carry back. The count is always over the whole set. */
	limit: z.coerce.number().int().min(1).max(200).default(20),

	/**
	 * How the surface should draw it, when it has a choice.
	 *
	 * A hint rather than an instruction: an insight whose answer is one number
	 * has nothing to chart however this is set, and MCP ignores it entirely.
	 */
	as: z.enum(["chart", "table", "number"]).default("table"),

	/** The path of the file defining it. What the studio edits. */
	path: z.string(),

	draft: z.boolean().default(false),

	/** Why this question is worth asking. Rendered above the answer. */
	body: z.string().default(""),
});

export type Insight = z.output<typeof insight>;

/** One labelled number. Every metric produces these, whatever it counts. */
export interface InsightRow {
	readonly label: string;
	readonly value: number;

	/** A second number where the metric has one - files beside tokens. */
	readonly secondary?: number;

	/** Where to go to act on this row, when there is somewhere. */
	readonly path?: string;
}

export interface InsightAnswer {
	readonly insight: Insight;

	/** The whole set, even when `rows` is a page of it. */
	readonly total: number;

	readonly rows: readonly InsightRow[];

	/**
	 * One sentence saying what the numbers mean.
	 *
	 * Written by the metric rather than by the author, because it depends on
	 * the answer: "nothing is undocumented" and "nine components have no api
	 * section" are the same insight and want different sentences.
	 */
	readonly finding: string;
}
