import { Breadcrumb, MarkdownView } from "@sushindustries/ui";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { findBuiltPage } from "../../modules/content/pages/pages.catalogue";
import { REFERENCES } from "../../modules/content/references.catalogue";
import { BLOCKS } from "../../modules/markdown/blocks";

/*
 * A built page: Markdown plus the block layer, at a URL.
 *
 * This is the page builder. `pnpm new page <slug>` writes the file, the
 * catalogue picks it up, and everything the site's components can do - the
 * showcase, the viewer, the grid, the shelf - is available to it through the
 * same `<!-- ::start:name -->` blocks every other document uses.
 *
 * Flat `$slug.tsx` - a dynamic segment never becomes a directory.
 */
export const Route = createFileRoute("/p/$slug")({
	component: BuiltPageView,
	loader: ({ params }) => {
		const page = findBuiltPage(params.slug);
		if (!page) throw notFound();
		return { page };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.page.title ?? "Page"} - Sushindustries` },
			{ name: "description", content: loaderData?.page.summary ?? "" },
		],
	}),
});

function BuiltPageView(): ReactNode {
	const { page } = Route.useLoaderData();

	return (
		<article className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<Breadcrumb
				origin="https://sushindustries.com"
				items={[{ label: "Sushindustries", href: "/" }, { label: page.title }]}
			/>

			<h1 className="h2 mt-5 text-balance">{page.title}</h1>
			{page.summary ? (
				<p className="mt-3 fg-dim max-w-prose text-pretty">{page.summary}</p>
			) : null}

			<div className="mt-7">
				<MarkdownView
					source={page.body}
					blocks={BLOCKS}
					references={REFERENCES}
				/>
			</div>
		</article>
	);
}
