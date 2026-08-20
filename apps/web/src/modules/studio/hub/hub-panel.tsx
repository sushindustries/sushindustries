import { BarChart, Collapsible, Icon, MarkdownView } from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { hubConfig } from "../studio.catalogue";
import { readySections } from "../studio.sections";
import { StudioSearch } from "../studio-search";
import { hubBarsQueryOptions } from "./hub-query-keys";

/*
 * The hub: one card per section, and nothing else.
 *
 * The home page used to be the overview - every chart and every table stacked
 * on it - which made it the longest page in the studio and the one you had to
 * scroll past to get anywhere. That is the wrong job for a landing page in a
 * tool: the first question is "which part of this do I want", and a wall of
 * numbers answers a different one.
 *
 * So the numbers moved to `/studio/insights`, which is a section like any
 * other, and this is the index. It is short on purpose.
 *
 * Every card comes from `studio.sections.ts`. Adding a section is a line there
 * and a route file - this file does not change, and cannot fall behind.
 */

export function HubPanel(): ReactNode {
	const config = hubConfig();
	const bars = useQuery(hubBarsQueryOptions());

	return (
		<div className="flex col gap-6">
			{/*
			 * Search first, and nothing competing with it.
			 *
			 * The question people arrive with is narrow - *this* post, *that*
			 * skill - and a box answers it in one step where browsing takes
			 * three. Everything below is what you read when you did not have a
			 * question, which is the less common case and belongs lower.
			 */}
			<StudioSearch />

			{/*
			 * The chart is `content/studio/hub.md`, drawn.
			 *
			 * Which bars exist, in what order, against which measure - all of it
			 * is frontmatter in that file, so changing what the hub shows is
			 * editing a document rather than a component. And because it is a
			 * document, the studio's own Documents section edits it: there is no
			 * settings screen to build or to keep in step.
			 */}
			{config.bars.length > 0 ? (
				<Collapsible summary="At a glance">
					<BarChart
						label={`${config.title}: ${config.bars.map((bar) => bar.label).join(", ")}`}
						description={config.summary}
						rows={(bars.data ?? []).map((bar) => ({
							label: bar.label,
							value: bar.value,
						}))}
						colorByCategory
						height={Math.max(140, config.bars.length * 28)}
					/>
				</Collapsible>
			) : null}

			{config.body ? (
				<article className="prose">
					<MarkdownView source={config.body} />
				</article>
			) : null}

			<section className="flex col gap-4">
				<h2 className="sr-only">Sections</h2>

				<div className="studio-tiles">
					{readySections().map((section) => (
						<Link
							key={section.path}
							to={section.to}
							className="card p-5 studio-hub-card"
						>
							<span className="flex items-center gap-2">
								<Icon name={section.icon} />
								<span className="text-lg font-semibold">{section.title}</span>
							</span>
							<span className="fg-dim text-sm">{section.about}</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
