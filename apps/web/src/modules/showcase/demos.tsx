import {
	Card,
	Credit,
	type CreditProps,
	DocAside,
	MarkdownView,
	parseFrontmatter,
	Reveal,
	readList,
	readString,
	ScrollSpin,
	Section,
	Showcase,
	SmoothScroll,
} from "@sushindustries/ui";
import { lazy, type ReactNode, Suspense } from "react";
import { PlaceholderMark } from "../chrome/placeholder-mark";

/*
 * The live examples, one per showcase id.
 *
 * Each entry is the smallest honest use of the component - small enough to
 * read at a glance, real enough that it would work if pasted. `source` is that
 * same example as text, kept beside the element rather than derived from it:
 * generating source from JSX is a compiler, and hand-writing it is two lines.
 *
 * They are only ever rendered inside the preview route, in an iframe, so a
 * demo that mounts something heavy costs nothing on the documentation page.
 */

const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

/*
 * Fixtures for the demos that need input rather than props.
 *
 * Kept beside the demos rather than imported from the site's real credits or a
 * real post: a demo that renders live content changes whenever that content
 * does, and a card that looked right last week starts showing something else.
 */
const CREDIT_SAMPLE: readonly CreditProps[] = [
	{
		name: "TanStack Start",
		by: "Tanner Linsley and the TanStack team",
		href: "https://tanstack.com/start",
		role: "The framework this site runs on",
	},
	{
		name: "Lenis",
		by: "Darkroom Engineering",
		href: "https://lenis.darkroom.engineering",
		role: "Smooth scrolling",
	},
];

const MARKDOWN_SAMPLE = `## A heading

Body copy, with \`inline code\` and a [link](https://tanstack.com).

> [!NOTE] Callouts are GitHub syntax
> They render as alert blocks rather than as quotes.

\`\`\`ts
export const highlighted = true;
\`\`\`

| Column | Column |
| --- | --- |
| Tables | work |
`;

const FRONTMATTER_SAMPLE = `---
title: A post
tags: [tanstack, css]
draft: false
---`;

/** Frontmatter has no UI, so the demo is the parse, shown as input and output. */
function FrontmatterDemo(): ReactNode {
	const meta = parseFrontmatter(
		FRONTMATTER_SAMPLE.replaceAll("---", "").trim(),
	);

	return (
		<div className="flex col gap-4">
			<div>
				<p className="label">In</p>
				<pre className="code-block mono text-sm mt-2">{FRONTMATTER_SAMPLE}</pre>
			</div>
			<div>
				<p className="label">Out</p>
				<dl className="mt-2 text-sm">
					<dt className="fg-faint mono">title</dt>
					<dd className="m-0 mt-1">{readString(meta, "title")}</dd>
					<dt className="fg-faint mono mt-3">tags</dt>
					<dd className="m-0 mt-1">{readList(meta, "tags").join(", ")}</dd>
				</dl>
			</div>
		</div>
	);
}

export interface Demo {
	/** The full example, shown in the showcase frame at real size. */
	readonly element: ReactNode;
	/**
	 * A compact, centred version for archive cards.
	 *
	 * Cards are 16:9 thumbnails. Several demos are deliberately taller than the
	 * viewport - a scroll effect has to be scrollable to be demonstrated - and
	 * dropping one of those into a thumbnail produces a scrollbar and a corner
	 * of a component instead of a picture of it. The poster is what the card
	 * shows; it falls back to `element` when the two can be the same.
	 */
	readonly poster?: ReactNode;
	readonly source: string;
	readonly language: string;
}

export const DEMOS: Readonly<Record<string, Demo>> = {
	"scroll-spin": {
		poster: <PlaceholderMark />,
		element: (
			<div style={{ minHeight: "160vh", paddingBlock: "10vh" }}>
				<ScrollSpin revolutions={1.5} tilt={10}>
					<PlaceholderMark />
				</ScrollSpin>
				<p className="label text-center mt-6">Scroll the frame</p>
			</div>
		),
		source: `<ScrollSpin revolutions={1.5} tilt={10}>
	<img src="/mark.svg" alt="" />
</ScrollSpin>`,
		language: "tsx",
	},

	reveal: {
		poster: (
			<Card title="I arrive on scroll">
				<p className="m-0 fg-dim text-sm">Fades and rises once, then stays.</p>
			</Card>
		),
		element: (
			<div style={{ minHeight: "160vh", paddingBlock: "40vh" }}>
				<Reveal>
					<Card title="I arrive on scroll">
						<p className="m-0 fg-dim text-sm">
							Fades and rises once, then stays.
						</p>
					</Card>
				</Reveal>
			</div>
		),
		source: `<Reveal delay={80}>
	<Card title="I arrive on scroll" />
</Reveal>`,
		language: "tsx",
	},

	card: {
		element: (
			<div className="card-grid">
				<Card title="With meta" meta="v0.1.0">
					<p className="m-0 fg-dim text-sm">Body goes here.</p>
				</Card>
				<Card title="As a link" href="https://tanstack.com" />
			</div>
		),
		source: `<Card title="With meta" meta="v0.1.0">
	<p>Body goes here.</p>
</Card>

<Card title="As a link" href="https://tanstack.com" />`,
		language: "tsx",
	},

	section: {
		element: (
			<Section id="demo" label="Label" title="A section heading">
				<p className="fg-dim m-0">
					The kicker and the heading reveal 80ms before this does.
				</p>
			</Section>
		),
		source: `<Section id="work" label="Work" title="A section heading">
	<p>Body content.</p>
</Section>`,
		language: "tsx",
	},

	/*
	 * Three components below render nothing visible when they are working:
	 * SmoothScroll mounts a scroll driver, Frontmatter is a parser. A demo for
	 * one of those cannot show the component, so it shows the effect instead,
	 * and says which is which. An empty frame would read as a broken demo.
	 */
	"smooth-scroll": {
		element: (
			<div style={{ minHeight: "220vh" }}>
				<SmoothScroll />
				<p className="label">Scroll this frame</p>
				<p className="fg-dim mt-3 max-w-prose">
					The easing is Lenis. Nothing here is animated by the demo; the whole
					frame scrolls differently because the component is mounted.
				</p>
				<p className="label" style={{ marginTop: "180vh" }}>
					The bottom
				</p>
			</div>
		),
		poster: <p className="label text-center">Changes how the page scrolls</p>,
		source: `<SmoothScroll />`,
		language: "tsx",
	},

	"doc-aside": {
		element: (
			<div className="doc-layout">
				<DocAside
					headings={[
						{ id: "one", text: "The first heading", level: 2 },
						{ id: "two", text: "The second", level: 2 },
						{ id: "three", text: "A nested one", level: 3 },
					]}
				/>
				<div style={{ minHeight: "180vh" }}>
					<h2 id="one">The first heading</h2>
					<p className="fg-dim">
						The rail tracks whichever heading you are under. Scroll the frame.
					</p>
					<h2 id="two" style={{ marginTop: "70vh" }}>
						The second
					</h2>
					<p className="fg-dim">
						Narrow the frame and the rail collapses to a row that opens on tap.
					</p>
					<h3 id="three" style={{ marginTop: "70vh" }}>
						A nested one
					</h3>
					<p className="fg-dim">Depth 3 indents under its parent.</p>
				</div>
			</div>
		),
		poster: <p className="label text-center">An on-page contents rail</p>,
		source: `<DocAside headings={collectHeadings(markdown)} />`,
		language: "tsx",
	},

	showcase: {
		/*
		 * The showcase showing a component is the only demo of it that is not a
		 * mock-up. The `src` is the same preview route every other frame uses.
		 */
		element: (
			<Showcase
				src="/preview/card"
				title="Card"
				height={260}
				code={'<Card title="With meta" meta="v0.1.0" />'}
				install={{ shadcn: "pnpm dlx shadcn@latest add .../card.json" }}
			/>
		),
		source: `<Showcase
	src="/preview/card"
	title="Card"
	code={source}
	install={{ shadcn: "pnpm dlx shadcn@latest add .../card.json" }}
/>`,
		language: "tsx",
	},

	credit: {
		/*
		 * Spread rather than written out, because `role` is a real credit field
		 * and also an ARIA attribute name: written as a literal on JSX it trips
		 * the a11y rule that has no idea this is not a DOM element. The site
		 * spreads `CREDITS` for the same reason.
		 */
		element: (
			<div className="flex col gap-3">
				{CREDIT_SAMPLE.map((credit) => (
					<Credit key={credit.href} {...credit} />
				))}
			</div>
		),
		source: `<Credit
	name="Lenis"
	by="Darkroom Engineering"
	href="https://lenis.darkroom.engineering"
	role="Smooth scrolling"
/>`,
		language: "tsx",
	},

	"markdown-view": {
		element: <MarkdownView source={MARKDOWN_SAMPLE} />,
		source: `<MarkdownView source={markdown} />`,
		language: "tsx",
	},

	frontmatter: {
		element: <FrontmatterDemo />,
		poster: <p className="label text-center">Reads the metadata block</p>,
		source: `const meta = parseFrontmatter(raw);

readString(meta, "title");   // "A post"
readList(meta, "tags");      // ["tanstack", "css"]`,
		language: "ts",
	},

	"product-viewer": {
		element: (
			<Suspense
				fallback={<p className="label text-center">Loading the mark</p>}
			>
				<ProductViewer
					model={{ url: "/models/logo.glb", realLength: 1 }}
					loadingLabel="Loading the mark"
				/>
			</Suspense>
		),
		source: `const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

<Suspense fallback={null}>
	<ProductViewer model={{ url: "/models/logo.glb", realLength: 1 }} />
</Suspense>`,
		language: "tsx",
	},
};

export function findDemo(id: string): Demo | undefined {
	return DEMOS[id];
}
