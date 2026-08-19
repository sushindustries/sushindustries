import { getDb } from "@sushindustries/db/client";
import { desc, documents, eq, pageViews, sql } from "@sushindustries/db/schema";
import { findInsight, listInsights } from "./insights.catalogue";
import type {
	Insight,
	InsightAnswer,
	InsightRow,
	Metric,
} from "./insights.schemas";

/*
 * The answers behind the questions.
 *
 * One function per metric, and the set is closed on purpose - an insight is
 * authored in Markdown by somebody who is not writing SQL, so a metric is a
 * word that maps to a query written here. An open set would be a query
 * language in frontmatter, which is a database with worse syntax.
 *
 * Every metric returns the same shape: labelled numbers and one sentence
 * saying what they mean. The sentence is written by the metric rather than by
 * the author because it depends on the answer - "nothing is undocumented" and
 * "nine components have no api section" are the same insight and want
 * different sentences.
 *
 * `.server.ts` because it opens a connection.
 */

const db = () => getDb();
const count = (value: number) => value.toLocaleString();

/** The five sections a documented component is meant to have. */
const SECTIONS = ["index", "get-started", "guides", "api", "examples"];

type Answer = { rows: InsightRow[]; total: number; finding: string };

async function tokensByKind(limit: number): Promise<Answer> {
	const rows = await db()
		.select({
			label: documents.kind,
			value: sql<number>`coalesce(sum(${documents.tokens}), 0)::int`,
			secondary: sql<number>`count(*)::int`,
		})
		.from(documents)
		.groupBy(documents.kind)
		.orderBy(desc(sql`sum(${documents.tokens})`))
		.limit(limit);

	const total = rows.reduce((sum, one) => sum + one.value, 0);
	const biggest = rows[0];

	return {
		rows: [...rows],
		total,
		finding: biggest
			? `${biggest.label} is ${Math.round((biggest.value / total) * 100)}% of the index by weight - ${count(biggest.value)} of ${count(total)} tokens.`
			: "Nothing indexed.",
	};
}

async function documentsByKind(limit: number): Promise<Answer> {
	const rows = await db()
		.select({
			label: documents.kind,
			value: sql<number>`count(*)::int`,
		})
		.from(documents)
		.groupBy(documents.kind)
		.orderBy(desc(sql`count(*)`))
		.limit(limit);

	const total = rows.reduce((sum, one) => sum + one.value, 0);
	return {
		rows: [...rows],
		total,
		finding: `${count(total)} documents across ${rows.length} kinds.`,
	};
}

async function mostViewed(limit: number): Promise<Answer> {
	const rows = await db()
		.select({ label: pageViews.path, value: pageViews.views })
		.from(pageViews)
		.orderBy(desc(pageViews.views))
		.limit(limit);

	const total = rows.reduce((sum, one) => sum + one.value, 0);

	return {
		rows: rows.map((one) => ({ ...one, path: one.label })),
		total,
		finding:
			rows.length === 0
				? "Nobody has opened anything since the counter was last reset. This is the one table nothing rebuilds, so an empty answer means no visits rather than a sync that has not run."
				: `${count(total)} views across ${rows.length} pages, led by ${rows[0]?.label}.`,
	};
}

async function heaviest(limit: number): Promise<Answer> {
	const rows = await db()
		.select({ label: documents.path, value: documents.tokens })
		.from(documents)
		.orderBy(desc(documents.tokens))
		.limit(limit);

	return {
		rows: rows.map((one) => ({ ...one, path: one.label })),
		total: rows.length,
		finding: rows[0]
			? `The heaviest document is ${count(rows[0].value)} tokens. Anything over about four thousand is a page somebody will not read in one sitting, and an agent will not load beside anything else.`
			: "Nothing indexed.",
	};
}

async function staleness(): Promise<Answer> {
	const [row] = await db()
		.select({
			synced: sql<Date | null>`max(${documents.syncedAt})`,
			total: sql<number>`count(*)::int`,
		})
		.from(documents);

	const at = row?.synced ? new Date(row.synced) : null;
	const hours = at ? Math.floor((Date.now() - at.getTime()) / 3_600_000) : -1;

	return {
		rows: [{ label: "hours behind", value: Math.max(0, hours) }],
		total: row?.total ?? 0,
		finding:
			hours < 0
				? "Never synced. Everything the studio shows is empty rather than stale."
				: hours < 1
					? "Synced within the hour. The index and the repository agree."
					: `Last synced ${hours} hours ago. Anything changed since is in the repository and not here - run the sync workflow.`,
	};
}

/**
 * Components that no page shows and nothing composes.
 *
 * The registry is the source for what exists, so this is deliberately *not* a
 * query: it reads the same catalogue the site renders from. A component with
 * no documentation row and no parent is one that was built and forgotten,
 * which is a question about the library rather than about the database.
 */
async function orphans(limit: number): Promise<Answer> {
	const { listRegistry } = await import("../../registry/registry.catalogue");

	const items = listRegistry();
	const composed = new Set(
		items.flatMap((one) => one.registryDependencies ?? []),
	);

	const documented = new Set(
		(
			await db()
				.select({ slug: documents.slug })
				.from(documents)
				.where(eq(documents.kind, "component"))
		)
			.map((one) => one.slug)
			.filter(Boolean),
	);

	const found = items.filter(
		(one) =>
			(one.kind ?? "component") !== "block" &&
			!composed.has(one.name) &&
			!documented.has(one.name),
	);

	return {
		rows: found
			.slice(0, limit)
			.map((one) => ({ label: one.name, value: 0, path: one.name })),
		total: found.length,
		finding:
			found.length === 0
				? "Every component is either documented or composed into something. Nothing was built and forgotten."
				: `${found.length} component${found.length === 1 ? "" : "s"} that nothing composes and no page documents.`,
	};
}

/** Components whose documentation is missing one of the five sections. */
async function sectionsMissing(limit: number): Promise<Answer> {
	const rows = await db()
		.select({ slug: documents.slug, section: documents.section })
		.from(documents)
		.where(eq(documents.kind, "component"));

	const bySlug = new Map<string, Set<string>>();
	for (const row of rows) {
		if (!row.slug || !row.section) continue;
		bySlug.set(row.slug, (bySlug.get(row.slug) ?? new Set()).add(row.section));
	}

	const short = [...bySlug.entries()]
		.map(([slug, has]) => ({
			label: slug,
			value: SECTIONS.filter((one) => !has.has(one)).length,
			missing: SECTIONS.filter((one) => !has.has(one)),
		}))
		.filter((one) => one.value > 0)
		.sort((a, b) => b.value - a.value);

	return {
		rows: short.slice(0, limit).map((one) => ({
			label: `${one.label} - missing ${one.missing.join(", ")}`,
			value: one.value,
		})),
		total: short.length,
		finding:
			short.length === 0
				? "Every documented component has all five sections."
				: `${short.length} component${short.length === 1 ? "" : "s"} short of the five sections. A missing api section is the one that costs a reader most.`,
	};
}

/** Components in the registry with no documentation row at all. */
async function undocumented(limit: number): Promise<Answer> {
	const { listRegistry } = await import("../../registry/registry.catalogue");

	const documented = new Set(
		(
			await db()
				.select({ slug: documents.slug })
				.from(documents)
				.where(eq(documents.kind, "component"))
		)
			.map((one) => one.slug)
			.filter(Boolean),
	);

	const found = listRegistry().filter((one) => !documented.has(one.name));

	return {
		rows: found
			.slice(0, limit)
			.map((one) => ({ label: one.name, value: 0, path: one.name })),
		total: found.length,
		finding:
			found.length === 0
				? "Every registry item has a documentation page."
				: `${found.length} registry item${found.length === 1 ? "" : "s"} with no page. The component page falls back to the registry blurb, which is one sentence.`,
	};
}

const RUN: Record<Metric, (limit: number) => Promise<Answer>> = {
	"tokens-by-kind": tokensByKind,
	"documents-by-kind": documentsByKind,
	"most-viewed": mostViewed,
	heaviest,
	staleness: () => staleness(),
	orphans,
	undocumented,
	"sections-missing": sectionsMissing,
};

async function answer(insight: Insight): Promise<InsightAnswer> {
	const { rows, total, finding } = await RUN[insight.metric](insight.limit);
	return { insight, rows, total, finding };
}

export async function getInsight(id: string): Promise<InsightAnswer | null> {
	const found = findInsight(id);
	return found ? answer(found) : null;
}

/**
 * Every insight, answered.
 *
 * All of them run, which is the deliberate cost: the page shows findings
 * rather than titles, and a list of questions with no answers is a list
 * somebody has to click through to learn anything from. There are a handful,
 * each is one query, and they run in parallel.
 */
export async function getInsights(): Promise<readonly InsightAnswer[]> {
	return Promise.all(listInsights().map(answer));
}
