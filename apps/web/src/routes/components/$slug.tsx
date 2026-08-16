import { collectHeadings, DocAside, MarkdownView } from "@sushindustries/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as z from "zod";
import { findComponentPage } from "../../modules/content/components/component-page";
import type { SectionId } from "../../modules/content/components/components.catalogue";
import { BLOCKS } from "../../modules/markdown/blocks";
import { findDemo } from "../../modules/showcase/demos";

/*
 * One component, its sections across the top.
 *
 * The tab lives in the URL rather than in state, so a link to the API tab is a
 * link to the API tab. That is the whole reason this is a search param and not
 * `useState` - documentation people cannot link into is documentation people
 * quote wrongly.
 *
 * Zod v4 schemas go straight into `validateSearch`; the adapter is only needed
 * on v3.
 */
const searchSchema = z.object({
	tab: z.string().optional(),
});

export const Route = createFileRoute("/components/$slug")({
	component: ComponentDocPage,
	validateSearch: searchSchema,
	loader: ({ params }) => {
		/*
		 * Falls back to a page generated from the registry entry, so every
		 * component in the archive opens - a card that links nowhere is worse
		 * than no card.
		 */
		const doc = findComponentPage(params.slug, (id) => Boolean(findDemo(id)));
		if (!doc) throw notFound();

		/*
		 * Headings per section, resolved in the loader. Parsing is synchronous
		 * and this runs on the server, so the contents list is part of the
		 * cached HTML rather than work the browser repeats.
		 */
		return {
			doc,
			headings: Object.fromEntries(
				doc.sections.map((section) => [
					section.id,
					collectHeadings(section.body),
				]),
			),
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.doc.title ?? "Component"} - Sushindustries` },
			{ name: "description", content: loaderData?.doc.summary ?? "" },
		],
	}),
});

function ComponentDocPage(): ReactNode {
	const { doc, headings } = Route.useLoaderData();
	const { tab } = Route.useSearch();

	// An unknown or absent tab falls back to the first section rather than
	// rendering nothing - a stale bookmark should show the page, not a blank.
	const active =
		doc.sections.find((section) => section.id === tab) ?? doc.sections[0];

	return (
		<article>
			<header className="doc-header">
				<div className="container">
					<Link to="/components" className="label">
						← Components
					</Link>

					<div className="mt-4 flex items-center gap-3 wrap">
						<h1 className="h2 m-0">{doc.title}</h1>
						<span className="label">{doc.packageName}</span>
					</div>

					{doc.summary ? (
						<p className="mt-3 fg-dim max-w-prose text-pretty">{doc.summary}</p>
					) : null}

					<nav className="doc-tabs mt-6" aria-label="Sections">
						{doc.sections.map((section) => (
							<Link
								key={section.id}
								to="/components/$slug"
								params={{ slug: doc.slug }}
								search={{ tab: section.id satisfies SectionId }}
								className="doc-tab"
								data-active={section.id === active?.id}
							>
								{section.label}
							</Link>
						))}
					</nav>
				</div>
			</header>

			<div className="container mt-7">
				{active ? (
					<div className="doc-layout">
						<DocAside headings={headings[active.id] ?? []} />
						<div className="min-w-0">
							<MarkdownView source={active.body} blocks={BLOCKS} />
						</div>
					</div>
				) : (
					<p className="fg-dim">Nothing written yet.</p>
				)}
			</div>
		</article>
	);
}
