import { Breadcrumb, MarkdownView } from "@sushindustries/ui";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DocActions } from "../../modules/content/doc-actions";
import { findBuiltPage } from "../../modules/content/pages/pages.catalogue";
import { REFERENCES } from "../../modules/content/references.catalogue";
import { seo } from "../../modules/content/seo";
import { SITE } from "../../modules/content/site.catalogue";
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
	head: ({ loaderData, params }) =>
		seo({
			notFound: !loaderData,
			title: loaderData?.page.title,
			description: loaderData?.page.summary,
			path: `/p/${params.slug}`,
			image: loaderData?.page.image,
		}),
});

function BuiltPageView(): ReactNode {
	const { page } = Route.useLoaderData();

	return (
		<article className="container" style={{ paddingBlock: "var(--s-8)" }}>
			{/*
			 * One column for the whole document.
			 *
			 * A built page has no sidebar, so the reading column *is* the page,
			 * and everything belongs on it. Without this the head ran the full
			 * 1180px container while the body ran 642px, which put the title,
			 * the trail and the copy button on three different left-to-right
			 * spans over the same text - the action strip ended up 440px to the
			 * right of the paragraph it described.
			 */}
			<div className="max-w-prose">
				<Breadcrumb
					origin={SITE.url}
					items={[{ label: SITE.name, href: "/" }, { label: page.title }]}
				/>

				<h1 className="h2 mt-5 text-balance">{page.title}</h1>
				{page.summary ? (
					<p className="mt-3 fg-dim text-pretty">{page.summary}</p>
				) : null}

				{/*
				 * Built pages are files in the repo like everything else, so they get
				 * the same bar the docs get: the date, the copy, and the edit link
				 * straight to the Markdown this page is rendered from.
				 */}
				<DocActions
					title={page.title}
					markdown={page.body}
					updated={page.updated}
					editPath={`apps/web/content/pages/${page.slug}.md`}
				/>

				<div className="mt-7">
					<MarkdownView
						source={page.body}
						blocks={BLOCKS}
						references={REFERENCES}
					/>
				</div>
			</div>
		</article>
	);
}
