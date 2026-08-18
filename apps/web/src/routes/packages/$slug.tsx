import {
	Breadcrumb,
	collectHeadings,
	DocAside,
	MarkdownView,
} from "@sushindustries/ui";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DocActions } from "../../modules/content/doc-actions";
import { DocFeedback } from "../../modules/content/doc-feedback";
import { findPackage } from "../../modules/content/packages/packages.catalogue";
import { REFERENCES } from "../../modules/content/references.catalogue";
import { pageTitle, SITE } from "../../modules/content/site.catalogue";
import {
	ldScript,
	packageApplication,
} from "../../modules/content/structured-data";
import { BLOCKS } from "../../modules/markdown/blocks";

/*
 * Kept as a flat route file rather than a `$slug/` directory. Converting a
 * dynamic segment to a route directory breaks matching - the URL starts
 * 404ing and the trailing-slash form redirects to the dead one.
 */
export const Route = createFileRoute("/packages/$slug")({
	component: PackagePage,
	loader: ({ params }) => {
		const entry = findPackage(params.slug);
		if (!entry) throw notFound();

		return { entry, headings: collectHeadings(entry.body) };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: pageTitle(loaderData?.entry.name ?? "Package") },
			{ name: "description", content: loaderData?.entry.description ?? "" },
		],
		scripts: loaderData ? [ldScript(packageApplication(loaderData.entry))] : [],
	}),
});

function PackagePage(): ReactNode {
	const { entry, headings } = Route.useLoaderData();

	return (
		<article className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<Breadcrumb
				origin={SITE.url}
				items={[
					{ label: SITE.name, href: "/" },
					{ label: "Packages", href: "/packages" },
					{ label: entry.name },
				]}
			/>

			<header className="mt-5">
				<div className="flex items-center gap-3 wrap">
					<h1 className="h2 m-0">{entry.name}</h1>
					<span className="label">{entry.version}</span>
				</div>
				<p className="mt-3 fg-dim max-w-prose text-pretty">
					{entry.description}
				</p>
				<code className="code mt-5 max-w-prose">{entry.install}</code>

				{/* The README is the page, so "Copy page" copies the README. */}
				<DocActions
					title={entry.name}
					markdown={entry.readme}
					markdownUrl={`/r/md/packages/${entry.slug}`}
					promptUrl={`${SITE.url}/r/prompt/packages/${entry.slug}`}
					editPath={`packages/${entry.slug}/README.md`}
				/>
			</header>

			<div className="mt-7">
				<div className="doc-layout">
					<DocAside
						headings={headings}
						footer={
							<DocFeedback
								page={`/packages/${entry.slug}`}
								markdown={entry.readme}
							/>
						}
					/>
					<div className="doc-main min-w-0">
						{/* `body`, not `readme`: the h1 above is this page's title. */}
						<MarkdownView
							source={entry.body}
							blocks={BLOCKS}
							references={REFERENCES}
						/>
					</div>
				</div>
			</div>
		</article>
	);
}
