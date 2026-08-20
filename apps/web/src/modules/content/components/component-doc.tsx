import {
	Breadcrumb,
	collectHeadings,
	DocAside,
	DocNav,
	type DocNavSection,
	MarkdownView,
} from "@sushindustries/ui";
import { findDemoSource, hasDemo } from "@sushindustries/ui/demo-sources";
import { REGISTRY_CATEGORIES } from "@sushindustries/ui/registry";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BLOCKS } from "../../markdown/blocks";
import { listRegistry } from "../../registry/registry.catalogue";
import { DocActions } from "../doc-actions";
import { DocBacklinks } from "../doc-backlinks";
import { DocFeedback } from "../doc-feedback";
import { REFERENCES } from "../references.catalogue";
import { SITE } from "../site.catalogue";
import { componentBacklinks } from "./backlinks";
import { findComponentPage } from "./component-page";

/*
 * The library, grouped, for the rail on the left.
 *
 * Module scope rather than the loader, and the reason is what a loader return
 * costs: it is serialised into the HTML of every component page, so putting
 * sixty items there would ship the whole catalogue twice - once in the bundle
 * that already contains it, once again as JSON under the document. The
 * registry is a build-time constant, so this is computed identically on the
 * server and in the browser and there is nothing to hand across.
 *
 * `listRegistry()` has already sorted by category and then title, so filtering
 * it per category keeps the order `/components` shows - a reader who scanned
 * the archive should find things in the same place here.
 */
const NAV_SECTIONS: readonly DocNavSection[] = REGISTRY_CATEGORIES.map(
	(category) => ({
		id: category.id,
		label: category.label,
		icon: category.icon,
		items: listRegistry()
			.filter((item) => item.category === category.id)
			.map((item) => ({
				id: item.name,
				label: item.title,
				href: `/components/${item.name}`,
			})),
	}),
);

/*
 * One component's documentation, for both of the routes that render it.
 *
 * `/components/card` and `/components/card/api` are the same page with a
 * different section open, so they are one component with a `section` prop
 * rather than two copies that drift. The routes either side of this are thin:
 * one loader each, and the choice of which section to open.
 */

/**
 * Everything either route needs, resolved once.
 *
 * Both routes call this: the loader is the same work whether a section was
 * named in the path or not, and duplicating it is how one of them ends up
 * missing a backlink the other has.
 */
export function loadComponentDoc(slug: string) {
	const doc = findComponentPage(
		slug,
		hasDemo,
		(id) => findDemoSource(id)?.source,
	);
	if (!doc) return null;

	return {
		doc,
		/*
		 * Headings per section, resolved here. Parsing is synchronous and this
		 * runs on the server, so the contents list is part of the cached HTML
		 * rather than work the browser repeats.
		 */
		headings: Object.fromEntries(
			doc.sections.map((section) => [
				section.id,
				collectHeadings(section.body),
			]),
		),
		// The element's place in the graph, so the connections footer is part of
		// the SSR'd page rather than a client scan.
		links: componentBacklinks(slug),
	};
}

export interface ComponentDocProps {
	readonly doc: NonNullable<ReturnType<typeof findComponentPage>>;
	readonly headings: Record<string, ReturnType<typeof collectHeadings>>;
	readonly links: ReturnType<typeof componentBacklinks>;
	/** Which section to open. Absent opens the first. */
	readonly section?: string;
}

export function ComponentDoc({
	doc,
	headings,
	links,
	section,
}: ComponentDocProps): ReactNode {
	/*
	 * An unknown or absent section falls back to the first rather than
	 * rendering nothing - a stale bookmark should show the page, not a blank.
	 */
	const active =
		doc.sections.find((one) => one.id === section) ?? doc.sections[0];

	return (
		<article>
			<header className="doc-header">
				<div className="container">
					<Breadcrumb
						origin={SITE.url}
						items={[
							{ label: SITE.name, href: "/" },
							{ label: "Components", href: "/components" },
							...(doc.item
								? [
										{
											label: doc.item.category,
											href: `/components?category=${doc.item.category}`,
										},
									]
								: []),
							{ label: doc.title },
						]}
					/>

					<div className="mt-4 flex items-center gap-3 wrap">
						<h1 className="h2 m-0">{doc.title}</h1>
						<span className="label">{doc.packageName}</span>
					</div>

					{doc.summary ? (
						<p className="mt-3 fg-dim max-w-prose text-pretty">{doc.summary}</p>
					) : null}

					{/*
					 * The same page, for every kind of reader: raw Markdown for a
					 * person, a one-line prompt for their agent, an edit link for
					 * whoever spots the typo. A generated page has no file to edit,
					 * so it offers the file instead - GitHub's new-file editor with
					 * the name and frontmatter filled in. Writing it replaces the
					 * generated Home outright.
					 */}
					<DocActions
						title={doc.title}
						updated={doc.generated ? undefined : doc.updated}
						markdown={doc.sections.map((section) => section.body).join("\n\n")}
						markdownUrl={`/components/${doc.slug}/index.md`}
						promptUrl={`${SITE.url}/r/prompt/${doc.slug}`}
						editPath={
							doc.generated
								? undefined
								: `packages/ui/docs/${doc.slug}/index.md`
						}
						writePath={
							doc.generated ? `packages/ui/docs/${doc.slug}` : undefined
						}
						writeBody={
							doc.generated
								? [
										"---",
										`title: ${doc.title}`,
										`summary: ${doc.summary}`,
										"updated: ",
										"---",
										"",
										doc.summary,
										"",
										`<!-- ::start:showcase demo="${doc.slug}" height="420" -->`,
										"<!-- ::end:showcase -->",
										"",
										"## Notes",
										"",
									].join("\n")
								: undefined
						}
					/>

					<nav className="doc-tabs mt-6" aria-label="Sections">
						{doc.sections.map((one) =>
							/*
							 * The first section is the component's own URL rather than a
							 * segment of it. Giving `index` a segment would be one page
							 * reachable at two addresses, which is the thing a canonical
							 * tag exists to apologise for.
							 */
							one.id === "index" ? (
								<Link
									key={one.id}
									to="/components/$slug"
									params={{ slug: doc.slug }}
									className="doc-tab"
									data-active={one.id === active?.id}
								>
									{one.label}
								</Link>
							) : (
								<Link
									key={one.id}
									to="/components/$slug/$section"
									params={{ slug: doc.slug, section: one.id }}
									className="doc-tab"
									data-active={one.id === active?.id}
								>
									{one.label}
								</Link>
							),
						)}
					</nav>
				</div>
			</header>

			<div className="container mt-7 pb-8">
				{active ? (
					<div className="doc-layout" data-nav="true">
						{/*
						 * The tab bar above moves between this element's sections; this
						 * is the only thing on the page that moves between elements.
						 */}
						<DocNav
							sections={NAV_SECTIONS}
							active={doc.slug}
							label="Components"
							renderLink={({ id, className, children, ...rest }) => (
								<Link
									to="/components/$slug"
									params={{ slug: id }}
									className={className}
									{...rest}
								>
									{children}
								</Link>
							)}
						/>
						<DocAside
							headings={headings[active.id] ?? []}
							footer={
								<DocFeedback
									page={`/components/${doc.slug}`}
									markdown={doc.sections
										.map((section) => section.body)
										.join("\n\n")}
								/>
							}
						/>
						<div className="doc-main min-w-0">
							<MarkdownView
								source={active.body}
								blocks={BLOCKS}
								references={REFERENCES}
							/>
						</div>
					</div>
				) : (
					<p className="fg-dim">Nothing written yet.</p>
				)}

				<DocBacklinks links={links} />
			</div>
		</article>
	);
}
