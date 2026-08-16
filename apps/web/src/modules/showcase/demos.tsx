import {
	Archive,
	type ArchiveCategory,
	type ArchiveItem,
	Card,
	Clock,
	ContextMenu,
	Credit,
	type CreditProps,
	DeskWindow,
	DocAside,
	Dock,
	FolderShelf,
	Grid,
	Laptop,
	MarkdownView,
	type MenuAction,
	NavBar,
	parseFrontmatter,
	Reveal,
	readList,
	readString,
	ScrollSpin,
	type ScrollTurn,
	Section,
	type ShelfEntry,
	Showcase,
	SmoothScroll,
	Spacer,
	useContextMenu,
	useScrollProgress,
	useScrollTurn,
} from "@sushindustries/ui";
import { lazy, type ReactNode, Suspense, useCallback, useRef } from "react";

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

const ARCHIVE_CATEGORIES: readonly ArchiveCategory[] = [
	{ id: "motion", label: "Motion" },
	{ id: "layout", label: "Layout" },
];

const ARCHIVE_ITEMS: readonly ArchiveItem[] = [
	{
		id: "reveal",
		title: "Reveal",
		description: "Fades and rises its children the first time they are seen.",
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "no-deps"],
		href: "#reveal",
		preview: "A card fading into place",
	},
	{
		id: "scroll-spin",
		title: "Scroll Spin",
		description: "Turns its children with the page scroll.",
		category: "motion",
		subcategory: "Scroll effects",
		tags: ["scroll", "transform"],
		href: "#scroll-spin",
		preview: "A mark turning as the page moves",
	},
	{
		id: "grid",
		title: "Grid",
		description: "A responsive grid with no breakpoints in it.",
		category: "layout",
		subcategory: "Page structure",
		tags: ["grid", "no-deps"],
		href: "#grid",
		meta: "v0.1.0",
		preview: "Cards reflowing from four columns to one",
	},
	{
		id: "spacer",
		title: "Spacer",
		description: "Vertical space on the scale, with an optional rule.",
		category: "layout",
		subcategory: "Page structure",
		tags: ["markdown", "no-deps"],
		href: "#spacer",
		preview: "A labelled rule holding a gap open",
	},
];

/**
 * Something with an obvious front and back, for the rotation demos.
 *
 * Deliberately not a mark of any kind. A logo turning edge-on is unreadable at
 * exactly the moment the rotation is most visible, and a demo subject that is
 * also a brand claim has to be right about two things instead of one.
 */
function SpinFace(): ReactNode {
	return (
		<div className="spin-face">
			<span className="mono">front</span>
		</div>
	);
}

/**
 * The hook has no UI at all, so the demo is its output.
 *
 * Printing the numbers is more honest than animating something: an animation
 * would show what `ScrollSpin` does, and `ScrollSpin` already has a page. What
 * this hands you is two floats per frame, so that is what the frame shows.
 */
function ScrollTurnReadout(): ReactNode {
	const turnRef = useRef<HTMLSpanElement>(null);
	const wobbleRef = useRef<HTMLSpanElement>(null);
	const markRef = useRef<HTMLDivElement>(null);

	const show = useCallback(({ turn, wobble }: ScrollTurn) => {
		if (turnRef.current) turnRef.current.textContent = turn.toFixed(3);
		if (wobbleRef.current) wobbleRef.current.textContent = wobble.toFixed(1);
		if (markRef.current) {
			markRef.current.style.transform = `rotate(${turn * 360}deg)`;
		}
	}, []);

	useScrollTurn(show);

	return (
		<div style={{ minHeight: "200vh" }}>
			<p className="label">Scroll the frame</p>

			<dl className="mt-4 text-sm mono">
				<dt className="fg-faint">turn</dt>
				<dd className="m-0 mt-1">
					<span ref={turnRef}>0.000</span> revolutions
				</dd>
				<dt className="fg-faint mt-3">wobble</dt>
				<dd className="m-0 mt-1">
					<span ref={wobbleRef}>0.0</span> degrees
				</dd>
			</dl>

			<div ref={markRef} className="mt-6" style={{ width: 96 }}>
				<SpinFace />
			</div>
		</div>
	);
}

const SHELF_SAMPLE: readonly ShelfEntry[] = [
	{
		id: "sauces",
		label: "Sauces",
		description: "Three of them",
		href: "#sauces",
		children: [
			{
				id: "hot",
				label: "Hot",
				description: "Two kinds",
				href: "#hot",
				children: [
					{
						id: "chilli",
						label: "Chilli oil",
						description: "The one everybody takes",
						href: "#chilli",
						meta: "220ml",
					},
					{
						id: "wasabi",
						label: "Wasabi",
						description: "Almost never actually wasabi",
						href: "#wasabi",
						meta: "40g",
					},
				],
			},
			{
				id: "soy",
				label: "Soy",
				description: "Dark, light, and the one for dipping",
				href: "#soy",
				meta: "3",
			},
		],
	},
	{
		id: "rice",
		label: "Rice",
		description: "Short grain only",
		href: "#rice",
		children: [
			{
				id: "sushi-rice",
				label: "Sushi rice",
				description: "Seasoned while still warm",
				href: "#sushi-rice",
				meta: "2kg",
			},
		],
	},
	{
		id: "readme",
		label: "README.md",
		description: "Not a folder, so it opens rather than expands",
		href: "#readme",
		icon: "file",
	},
];

/** Actions that say what they would have done, so the demo has no side effects. */
function sampleActions(entry: ShelfEntry): MenuAction[] {
	return [
		{ id: "open", label: "Open", icon: "folder-open", onSelect() {} },
		{
			id: "md",
			label: "Save as Markdown",
			icon: "download",
			hint: ".md",
			onSelect() {},
		},
		{ id: "copy", label: "Copy link", icon: "link", onSelect() {} },
		{
			id: "share",
			label: `Share ${entry.label}`,
			icon: "share",
			onSelect() {},
		},
	];
}

/** Progress has no UI either, so the demo is a bar and the number driving it. */
function ProgressReadout(): ReactNode {
	const stageRef = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	const valueRef = useRef<HTMLSpanElement>(null);

	const show = useCallback((progress: number) => {
		if (barRef.current) {
			barRef.current.style.transform = `scaleX(${progress})`;
		}
		if (valueRef.current) {
			valueRef.current.textContent = progress.toFixed(3);
		}
	}, []);

	useScrollProgress(stageRef, show);

	return (
		<div style={{ minHeight: "200vh", paddingTop: "60vh" }}>
			<div ref={stageRef}>
				<p className="label">Scroll the frame</p>
				<div
					style={{
						height: 6,
						marginTop: 12,
						background: "var(--bg-2)",
						borderRadius: 999,
						overflow: "hidden",
					}}
				>
					<div
						ref={barRef}
						style={{
							height: "100%",
							background: "var(--accent)",
							transformOrigin: "left",
							transform: "scaleX(0)",
						}}
					/>
				</div>
				<p className="mono text-sm mt-3 fg-dim">
					<span ref={valueRef}>0.000</span> of the way up
				</p>
			</div>
		</div>
	);
}

/** The menu on its own, opened from a button so the demo needs no right-click. */
function MenuDemo(): ReactNode {
	const menu = useContextMenu();

	return (
		<div className="flex col items-start gap-4" {...menu.triggerProps}>
			<p className="fg-dim m-0 max-w-prose">
				Right-click this area, hold it on a touch screen, or press the button.
				All three open the same menu, and it answers to arrow keys and Escape.
			</p>

			<button type="button" className="showcase-btn" {...menu.buttonProps}>
				Actions
			</button>

			<ContextMenu
				state={menu}
				actions={[
					{ id: "open", label: "Open", icon: "folder-open", onSelect() {} },
					{
						id: "md",
						label: "Save as Markdown",
						icon: "download",
						hint: ".md",
						onSelect() {},
					},
					{ id: "copy", label: "Copy link", icon: "link", onSelect() {} },
					{
						id: "share",
						label: "Share with a friend",
						icon: "share",
						onSelect() {},
					},
				]}
			/>
		</div>
	);
}

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
		/*
		 * A plain square, not a logo.
		 *
		 * The demo used to spin an SVG captioned "Sushindustries" that was not the
		 * Sushindustries logo, which is a worse thing to ship than no mark at all.
		 * The home page turns the real GLB; this page is about the rotation, and
		 * an unmarked face shows the rotation better than a logo would anyway -
		 * you can see which side you are looking at.
		 */
		poster: <SpinFace />,
		element: (
			<div style={{ minHeight: "160vh", paddingBlock: "10vh" }}>
				<ScrollSpin revolutions={1.5} tilt={10}>
					<SpinFace />
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

	"use-scroll-turn": {
		element: <ScrollTurnReadout />,
		poster: <p className="label text-center">An angle, every frame</p>,
		source: `useScrollTurn(({ turn, wobble }) => {
	node.style.transform = \`rotateY(\${turn * 360}deg)\`;
});`,
		language: "tsx",
	},

	archive: {
		/*
		 * Fixtures, not this site's real registry. A demo that lists the live
		 * catalogue changes every time a component is added, so the card stops
		 * being a picture of the Archive and becomes a picture of today's index.
		 */
		element: (
			<Archive
				categories={ARCHIVE_CATEGORIES}
				items={ARCHIVE_ITEMS}
				hrefForCategory={(id) => `#${id}`}
				hrefForTag={(tag) => (tag ? `#${tag}` : "#all")}
				renderLink={({ href, className, children }) => (
					<a href={href} className={className}>
						{children}
					</a>
				)}
			/>
		),
		source: `<Archive
	categories={categories}
	items={items}
	hrefForCategory={(id) => \`/components?category=\${id}\`}
	renderLink={({ kind, id, className, children }) =>
		kind === "item" ? (
			<Link to="/components/$slug" params={{ slug: id }} className={className}>
				{children}
			</Link>
		) : (
			<Link to="/components" search={{ category: id }} className={className}>
				{children}
			</Link>
		)
	}
/>`,
		language: "tsx",
	},

	"use-scroll-progress": {
		element: <ProgressReadout />,
		poster: <p className="label text-center">0 to 1, as it arrives</p>,
		source: `useScrollProgress(ref, (progress) => {
	bar.style.transform = \`scaleX(\${progress})\`;
});`,
		language: "tsx",
	},

	laptop: {
		element: (
			<Laptop title="a laptop" wallpaper={<span className="desk-glow" />}>
				<FolderShelf
					entries={SHELF_SAMPLE}
					label="A pantry"
					searchable
					actionsFor={sampleActions}
				/>
			</Laptop>
		),
		source: `<Laptop title="sushindustries" wallpaper={<Wallpaper />}>
	<FolderShelf entries={entries} searchable actionsFor={actionsFor} />
</Laptop>`,
		language: "tsx",
	},

	"desk-window": {
		element: (
			<div className="relative" style={{ height: 320 }}>
				<DeskWindow
					title="One window"
					x={12}
					y={12}
					z={1}
					onMove={() => {}}
					onClose={() => {}}
					onRaise={() => {}}
				>
					<p className="p-4 fg-dim m-0 text-sm">
						Drag the bar. Position is written to the element while you drag and
						to state only when you let go.
					</p>
				</DeskWindow>
			</div>
		),
		poster: <p className="label text-center">A window you can drag</p>,
		source: `<DeskWindow
	title="Applications"
	x={x} y={y} z={z}
	onMove={(x, y) => desk.move(id, x, y)}
	onClose={() => desk.close(id)}
	onRaise={() => desk.raise(id)}
/>`,
		language: "tsx",
	},

	dock: {
		element: (
			<Dock
				tasks={[
					{ id: "a", label: "Applications", active: true },
					{ id: "b", label: "Documents" },
				]}
				results={[
					{
						id: "one",
						label: "Reveal",
						description: "Fades and rises on scroll",
						icon: "file",
						onSelect() {},
					},
				]}
				query=""
			/>
		),
		poster: <p className="label text-center">A launcher and what is open</p>,
		source: `<Dock
	tasks={tasks}
	onSelectTask={desk.raise}
	onCloseTask={desk.close}
	results={results}
	query={query}
	onQuery={setQuery}
/>`,
		language: "tsx",
	},

	"use-desk-state": {
		element: (
			<p className="fg-dim p-4 max-w-prose">
				No UI. It holds which windows are open, where they sit and what has been
				put away, reads storage in an effect so a server render still matches,
				and treats every storage failure as "the default desk", which is a
				working desk.
			</p>
		),
		poster: (
			<p className="label text-center">It remembers where you left things</p>
		),
		source: `const desk = useDeskState("my.desk");

desk.open(["applications", "motion"]);
desk.move(id, x, y);
desk.raise(id);`,
		language: "ts",
	},

	"context-menu": {
		element: <MenuDemo />,
		poster: <p className="label text-center">Right-click, hold, or press</p>,
		source: `const menu = useContextMenu();

<div {...menu.triggerProps}>
	<button {...menu.buttonProps}>Actions</button>
</div>

<ContextMenu state={menu} actions={actions} />`,
		language: "tsx",
	},

	"folder-shelf": {
		element: (
			<FolderShelf
				entries={SHELF_SAMPLE}
				label="A pantry"
				actionsFor={sampleActions}
			/>
		),
		source: `<FolderShelf
	entries={shelfEntries()}
	actionsFor={(entry, path) => shelfActions(entry, path)}
/>`,
		language: "tsx",
	},

	grid: {
		element: (
			<Grid min="14rem" gap={4}>
				{["One", "Two", "Three", "Four"].map((label) => (
					<Card key={label} title={label}>
						<p className="m-0 fg-dim text-sm">
							Narrow the frame. The column count follows the width, and no
							breakpoint decided it.
						</p>
					</Card>
				))}
			</Grid>
		),
		source: `<Grid min="14rem" gap={4}>
	<Card title="One" />
	<Card title="Two" />
	<Card title="Three" />
	<Card title="Four" />
</Grid>`,
		language: "tsx",
	},

	spacer: {
		element: (
			<div>
				<p className="fg-dim m-0">Something above.</p>
				<Spacer size={6} label="Then" />
				<p className="fg-dim m-0">Something below, a measured distance away.</p>
				<Spacer size={5} rule />
				<p className="fg-dim m-0">A rule with no label.</p>
				<Spacer size={5} />
				<p className="fg-dim m-0">And a plain gap.</p>
			</div>
		),
		source: `<Spacer size={6} label="Then" />
<Spacer size={5} rule />
<Spacer size={5} />`,
		language: "tsx",
	},

	"nav-bar": {
		/*
		 * Its own entries rather than the site's: a demo that renders the live nav
		 * changes whenever the nav does, and the card stops being a picture of the
		 * component and starts being a picture of today's menu.
		 */
		element: (
			<NavBar
				brand={<span className="mono text-sm font-semibold">acme</span>}
				entries={[
					{
						label: "Products",
						href: "/products",
						icon: "package",
						items: [
							{
								label: "Motion",
								href: "/products/motion",
								icon: "motion",
								description: "Things that move, and stop when asked not to",
								badge: "3",
							},
							{
								label: "Layout",
								href: "/products/layout",
								icon: "grid",
								description: "Grids, spacing and page structure",
								badge: "5",
							},
						],
					},
					{ label: "Writing", href: "/writing", icon: "note" },
				]}
				trailing={<span className="nav-link">GitHub</span>}
			/>
		),
		poster: <p className="label text-center">A header with expanding panels</p>,
		source: `<NavBar
	brand={<span className="mono">acme</span>}
	entries={navEntries()}
	trailing={<a href="https://github.com/...">GitHub</a>}
/>`,
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

	clock: {
		element: (
			<div className="flex col gap-4">
				<p className="fg-dim m-0 max-w-prose">
					Your weekday and your local time, from `Intl` with no locale and no
					zone passed. Nothing was asked and nothing was sent.
				</p>
				<Clock />
				<Clock
					options={{
						weekday: "long",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					}}
					every={1000}
				/>
			</div>
		),
		poster: <Clock />,
		source: `<Clock />

<Clock
	options={{ weekday: "long", hour: "2-digit", minute: "2-digit" }}
	every={1000}
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
