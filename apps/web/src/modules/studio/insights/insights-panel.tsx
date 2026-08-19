import {
	BarChart,
	Collapsible,
	DataTable,
	type DataTableColumn,
	Icon,
	MarkdownView,
} from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { InsightAnswer, InsightRow } from "./insights.schemas";
import { insightsQueryOptions } from "./insights-query-keys";

/*
 * Insights, one section each.
 *
 * This was two hard-coded panels of whatever the report happened to compute,
 * which made "what does this tell me" unanswerable without reading all of it.
 * Now each is a named question defined in `content/insights/*.md`, answered by
 * one metric, and rendered by one branch here - so adding an insight is a
 * Markdown file, and the file is a document the studio can already edit.
 *
 * Every section is collapsed except the first. Seven panels stacked open is a
 * page you scroll through to find the one you came for, and `Collapsible` is a
 * `<details>` so the state is the browser's and Ctrl-F still reaches inside a
 * closed one.
 *
 * The finding is above the numbers rather than under them. An insight whose
 * answer needs interpreting has not finished being an insight - "source is 62%
 * of the index by weight" is the thing to read, and the rows are the evidence
 * for anybody who doubts it.
 */

const number = (value: number) => value.toLocaleString();

export function InsightsPanel(): ReactNode {
	const insights = useQuery(insightsQueryOptions());
	const all = insights.data ?? [];

	if (insights.isPending) {
		return <p className="fg-dim">Answering…</p>;
	}

	if (all.length === 0) {
		return (
			<p className="fg-dim">
				No insights defined. Each one is a Markdown file in{" "}
				<code>apps/web/content/insights</code> naming a metric.
			</p>
		);
	}

	return (
		<div className="flex col gap-4">
			{all.map((answer, at) => (
				<Collapsible
					key={answer.insight.id}
					defaultOpen={at === 0}
					summary={
						<span className="flex items-center gap-2">
							<Icon name={ICONS[answer.insight.as] ?? "layers"} />
							{answer.insight.title}
						</span>
					}
				>
					<Answer answer={answer} />
				</Collapsible>
			))}
		</div>
	);
}

/** A glyph per shape, so the three kinds of answer are told apart at a glance. */
const ICONS = {
	chart: "layers",
	table: "grid",
	number: "clock",
} as const;

function Answer({ answer }: { readonly answer: InsightAnswer }): ReactNode {
	const { insight, rows, total, finding } = answer;

	const columns: DataTableColumn<InsightRow>[] = [
		{ id: "label", header: "What", mono: true, sortable: true },
		{
			id: "value",
			header: "Count",
			numeric: true,
			sortable: true,
			cell: (row) => number(row.value),
		},
	];

	return (
		<div className="flex col gap-4">
			{/*
			 * The finding first. An insight whose answer needs interpreting has
			 * not finished being an insight; the rows below are the evidence.
			 */}
			<p className="studio-notice m-0">{finding}</p>

			{insight.body ? (
				<article className="prose">
					<MarkdownView source={insight.body} />
				</article>
			) : null}

			{insight.as === "chart" && rows.length > 0 ? (
				<BarChart
					label={insight.title}
					description={finding}
					rows={rows.map((row) => ({ label: row.label, value: row.value }))}
					colorByCategory
					height={Math.max(160, rows.length * 28)}
				/>
			) : null}

			{/*
			 * The table is drawn for every shape except `number`, chart included.
			 * A chart is an image to a screen reader however good its label is, so
			 * the table is the accessible answer rather than a fallback - which is
			 * why it is stacked under rather than behind a toggle.
			 */}
			{insight.as !== "number" ? (
				<DataTable
					label={`${insight.title} - the rows behind it`}
					rows={rows}
					columns={columns}
					density="compact"
					striped={rows.length > 12}
					empty="Nothing matched, which for this question is usually the good answer."
				/>
			) : null}

			<p className="fg-faint text-xs mono">
				{number(total)} in the set
				{rows.length < total ? `, showing ${number(rows.length)}` : ""} ·{" "}
				{insight.metric}
			</p>
		</div>
	);
}
