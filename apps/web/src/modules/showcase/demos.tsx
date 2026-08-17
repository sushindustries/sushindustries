import {
	Accordion,
	Alert,
	Archive,
	type ArchiveCategory,
	type ArchiveItem,
	AspectRatio,
	Avatar,
	Badge,
	BootLoader,
	Breadcrumb,
	Button,
	Card,
	Checkbox,
	Clock,
	CodeBlock,
	Collapsible,
	CommandPalette,
	ContextMenu,
	CopyButton,
	Credit,
	type CreditProps,
	DeskWindow,
	Device,
	Dialog,
	DocAside,
	Dock,
	Empty,
	Field,
	FolderShelf,
	Grid,
	Heading,
	Hero,
	Icon,
	Input,
	Item,
	Kbd,
	Label,
	Lead,
	MarkdownView,
	type MenuAction,
	NativeSelect,
	NavBar,
	Pagination,
	type PaletteEntry,
	Progress,
	parseFrontmatter,
	Questions,
	RadioGroup,
	Ref,
	Reveal,
	readList,
	readString,
	ScrollArea,
	ScrollSpin,
	type ScrollTurn,
	Section,
	Separator,
	Sheet,
	type ShelfEntry,
	Showcase,
	Skeleton,
	Slider,
	SmoothScroll,
	Spacer,
	Spinner,
	Switch,
	Table,
	Textarea,
	ThemeToggle,
	ToastProvider,
	ToggleGroup,
	Tooltip,
	TypedMark,
	useContextMenu,
	useDeviceKind,
	useScrollProgress,
	useScrollTurn,
	useToast,
	VideoPlayer,
} from "@sushindustries/ui";

import {
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useRef,
	useState,
} from "react";
import { LOGO_MODEL } from "../chrome/logo";
import { askAssistant } from "../markdown/questions.store";
import { DEMO_SOURCES } from "./demo-sources";
import { pacedImport } from "./paced-import";

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

const ProductViewer = lazy(() =>
	pacedImport(() => import("@sushindustries/react-product-viewer")),
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
		dependencies: [],
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
		dependencies: ["three"],
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
		dependencies: [],
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
		dependencies: [],
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

/** The palette needs open state, so its demo carries a trigger. */
function CommandPaletteDemo(): ReactNode {
	const [open, setOpen] = useState(false);

	const entries: readonly PaletteEntry[] = [
		{
			id: "card",
			title: "Card",
			hint: "Title, meta, body",
			href: "#card",
			group: "layout",
			icon: "layers",
		},
		{
			id: "showcase",
			title: "Showcase",
			hint: "A component at every width",
			href: "#showcase",
			group: "content",
			icon: "text",
		},
		{
			id: "device",
			title: "Device",
			hint: "Three machines in CSS 3D",
			href: "#device",
			group: "layout",
			icon: "cube",
		},
	];

	return (
		<div className="flex justify-center">
			<button
				type="button"
				className="palette-trigger"
				onClick={() => setOpen(true)}
			>
				Search
				<kbd className="palette-kbd">⌘K</kbd>
			</button>
			<CommandPalette
				entries={entries}
				open={open}
				onClose={() => setOpen(false)}
				onSelect={() => setOpen(false)}
			/>
		</div>
	);
}

/** Toggles need state, so their demo carries it. */
function ToggleDemo(): ReactNode {
	const [view, setView] = useState("preview");
	return (
		<ToggleGroup
			label="View"
			value={view}
			onChange={setView}
			options={[
				{ value: "preview", label: "Preview" },
				{ value: "code", label: "Code" },
				{ value: "split", label: "Split" },
			]}
		/>
	);
}

function DialogDemo(): ReactNode {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="ghost" onClick={() => setOpen(true)}>
				Delete the draft
			</Button>
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				title="Delete the draft?"
				footer={
					<>
						<Button variant="ghost" onClick={() => setOpen(false)}>
							Keep it
						</Button>
						<Button onClick={() => setOpen(false)}>Delete</Button>
					</>
				}
			>
				It has been three weeks.
			</Dialog>
		</>
	);
}

function SheetDemo(): ReactNode {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="ghost" onClick={() => setOpen(true)}>
				Open the filters
			</Button>
			<Sheet open={open} onClose={() => setOpen(false)} title="Filters">
				<div className="flex col gap-4">
					<Field label="Category">
						<NativeSelect defaultValue="all">
							<option value="all">All</option>
							<option value="motion">Motion</option>
						</NativeSelect>
					</Field>
					<Switch label="Only no-deps" defaultChecked />
				</div>
			</Sheet>
		</>
	);
}

function ToastCaller(): ReactNode {
	const { toast } = useToast();
	return (
		<Button variant="ghost" onClick={() => toast("Copied the command")}>
			Do the thing
		</Button>
	);
}

function ToastDemo(): ReactNode {
	return (
		<ToastProvider>
			<ToastCaller />
		</ToastProvider>
	);
}

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

/**
 * The hook names the machine, so the demo prints the name.
 *
 * It is worth watching this one resize: it says "measuring" for exactly one
 * frame and then never lies again, which is the whole argument for it
 * returning `null` rather than guessing "laptop" on the server.
 */
function DeviceReadout(): ReactNode {
	const kind = useDeviceKind();

	return (
		<div className="p-6 text-center">
			<p className="label">This window is currently a</p>
			<p className="mono text-lg mt-2">{kind ?? "measuring"}</p>
			<p className="label mt-4">Resize the frame and it changes</p>
		</div>
	);
}

/**
 * The toggle keeps no state, so the demo is the state it does not keep.
 *
 * Deliberately not wired to the real theme: a demo that repainted the whole
 * documentation page every time somebody poked it would be a demo nobody could
 * poke twice.
 */
function ThemeToggleDemo(): ReactNode {
	const [theme, setTheme] = useState("light");

	return (
		<div className="p-6 flex col items-center gap-4">
			<ThemeToggle
				options={[
					{ id: "light", label: "Light", icon: "sun" },
					{ id: "dark", label: "Dark", icon: "moon" },
					{ id: "system", label: "System", icon: "contrast" },
				]}
				value={theme}
				onChange={setTheme}
			/>
			<p className="label m-0">{theme}</p>
		</div>
	);
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
		...DEMO_SOURCES["scroll-spin"],
	},

	"typed-mark": {
		/*
		 * On the terminal slab, because that is the surface the `--syn-*` hues
		 * were checked against. The same nine colours on paper would be a
		 * demo of an accessibility failure.
		 */
		poster: (
			<div
				className="p-6 text-lg"
				style={{
					background: "var(--code-bg)",
					borderRadius: "var(--r-lg)",
					fontFamily: "var(--mono)",
				}}
			>
				<TypedMark text="sushi industries" />
			</div>
		),
		element: (
			<div
				className="p-6 grid gap-4"
				style={{
					background: "var(--code-bg)",
					borderRadius: "var(--r-lg)",
					fontFamily: "var(--mono)",
				}}
			>
				<span className="text-lg">
					<TypedMark text="sushi industries" />
				</span>
				{/* `offset` moves where the cycle starts, so two marks differ. */}
				<span className="text-lg">
					<TypedMark text="one class, one job" offset={4} />
				</span>
			</div>
		),
		...DEMO_SOURCES["typed-mark"],
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
		...DEMO_SOURCES.reveal,
	},

	questions: {
		element: (
			<Questions
				heading="Common questions"
				questions={[
					"How do I install a component?",
					"Do I need the whole library?",
					"What happens when a component updates?",
				]}
				onAsk={askAssistant}
			/>
		),
		...DEMO_SOURCES.questions,
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
		...DEMO_SOURCES.card,
	},

	section: {
		element: (
			<Section id="demo" label="Label" title="A section heading">
				<p className="fg-dim m-0">
					The kicker and the heading reveal 80ms before this does.
				</p>
			</Section>
		),
		...DEMO_SOURCES.section,
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
		...DEMO_SOURCES["smooth-scroll"],
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
		...DEMO_SOURCES["doc-aside"],
	},

	hero: {
		element: (
			<div className="flex col gap-7">
				{/*
				 * The doc variant, with everything it can carry: a trail, a name
				 * written as a tag, a version, three measured facts, two actions
				 * and a picture. The shot points at a real component's captures,
				 * so this demo is also a check that they were generated.
				 */}
				<Hero
					trail={
						<Breadcrumb
							items={[
								{ label: "Sushindustries", href: "/" },
								{ label: "Components", href: "/components" },
								{ label: "Avatar" },
							]}
						/>
					}
					name="avatar"
					version="0.1.0"
					title="Avatar"
					summary="A face, its initials, or the tone of the group it belongs to."
					facts={[
						{ icon: "calendar", label: "Last updated", value: "17 Aug 2026" },
						{ icon: "clock", label: "Reading time", value: "2 min read" },
						{ icon: "spark", label: "Agent", value: "agent ready" },
					]}
					shot={{
						alt: "The Avatar component, captured on a laptop",
						aspect: "16 / 10",
						sources: [
							{ src: "/shots/avatar-phone.webp", width: 352 },
							{ src: "/shots/avatar-tablet.webp", width: 640 },
							{ src: "/shots/avatar-laptop.webp", width: 960 },
						],
					}}
					actions={
						<>
							<Button href="/components/avatar" variant="ghost">
								Docs
							</Button>
							<CopyButton
								text="Fetch and execute the instructions at https://sushindustries.com/r/prompt/avatar"
								label="Copy prompt"
								icon="spark"
								ground="accent"
							/>
						</>
					}
				/>

				{/*
				 * The landing variant, with a stand-in for the 3D mark. The real
				 * one is a site module and has no business inside a component demo.
				 */}
				<Hero
					variant="landing"
					title="Sushindustries"
					summary="Check what I am building. Small packages, made to be used."
					media={
						<AspectRatio ratio={1}>
							<div className="flex items-center justify-center h-full bg-2 rounded-lg">
								<Icon name="sushi" size={64} />
							</div>
						</AspectRatio>
					}
					actions={
						<>
							<Button href="/components">Browse the components</Button>
							<Button href="/packages" variant="ghost">
								See the packages
							</Button>
						</>
					}
				/>
			</div>
		),
		poster: <p className="label text-center">A page head, and its facts</p>,
		...DEMO_SOURCES.hero,
	},

	"video-player": {
		element: (
			<VideoPlayer
				title="Never Gonna Give You Up"
				provider="youtube"
				poster="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
				caption="Press play and the frame appears. Press stop and it is gone again, along with everything it loaded."
			>
				<iframe
					src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
					title="Never Gonna Give You Up"
					allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				/>
			</VideoPlayer>
		),
		poster: <p className="label text-center">A video behind its own poster</p>,
		...DEMO_SOURCES["video-player"],
	},

	"use-scroll-turn": {
		element: <ScrollTurnReadout />,
		poster: <p className="label text-center">An angle, every frame</p>,
		...DEMO_SOURCES["use-scroll-turn"],
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
		...DEMO_SOURCES.archive,
	},

	"use-scroll-progress": {
		element: <ProgressReadout />,
		poster: <p className="label text-center">0 to 1, as it arrives</p>,
		...DEMO_SOURCES["use-scroll-progress"],
	},

	"theme-toggle": {
		element: <ThemeToggleDemo />,
		poster: <p className="label text-center">three states, one tab stop</p>,
		...DEMO_SOURCES["theme-toggle"],
	},

	"boot-loader": {
		element: (
			<div className="relative" style={{ height: 300 }}>
				<BootLoader duration={2400} label="Loading the demo">
					<div className="spin-face">
						<span className="mono">boot</span>
					</div>
				</BootLoader>
			</div>
		),
		...DEMO_SOURCES["boot-loader"],
	},

	device: {
		element: (
			<Device title="a machine" wallpaper={<span className="desk-glow" />}>
				<FolderShelf
					entries={SHELF_SAMPLE}
					label="A pantry"
					actionsFor={sampleActions}
				/>
			</Device>
		),
		...DEMO_SOURCES.device,
	},

	"use-device-kind": {
		element: <DeviceReadout />,
		poster: <p className="label text-center">the machine, named</p>,
		...DEMO_SOURCES["use-device-kind"],
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
		...DEMO_SOURCES["desk-window"],
	},

	dock: {
		element: (
			<Dock
				tasks={[
					{ id: "a", label: "Components", active: true },
					{ id: "b", label: "Search", icon: "search" },
				]}
				onSearch={() => {}}
				onSelectTask={() => {}}
				onCloseTask={() => {}}
				trailing={<Clock />}
			/>
		),
		poster: <p className="label text-center">Search, what is open, a corner</p>,
		...DEMO_SOURCES.dock,
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
		...DEMO_SOURCES["use-desk-state"],
	},

	"context-menu": {
		element: <MenuDemo />,
		poster: <p className="label text-center">Right-click, hold, or press</p>,
		...DEMO_SOURCES["context-menu"],
	},

	"folder-shelf": {
		element: (
			<FolderShelf
				entries={SHELF_SAMPLE}
				label="A pantry"
				actionsFor={sampleActions}
			/>
		),
		...DEMO_SOURCES["folder-shelf"],
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
		...DEMO_SOURCES.grid,
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
		...DEMO_SOURCES.spacer,
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
		...DEMO_SOURCES["nav-bar"],
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
		...DEMO_SOURCES.showcase,
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
		...DEMO_SOURCES.clock,
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
		...DEMO_SOURCES.credit,
	},

	"markdown-view": {
		element: <MarkdownView source={MARKDOWN_SAMPLE} />,
		...DEMO_SOURCES["markdown-view"],
	},

	breadcrumb: {
		element: (
			<Breadcrumb
				items={[
					{ label: "Adam Jurek", href: "/" },
					{ label: "Components", href: "/components" },
					{ label: "Docs", href: "/components?category=docs" },
					{ label: "Breadcrumb" },
				]}
			/>
		),
		...DEMO_SOURCES.breadcrumb,
	},

	"command-palette": {
		element: <CommandPaletteDemo />,
		...DEMO_SOURCES["command-palette"],
	},

	pagination: {
		element: (
			<div className="flex justify-center">
				<Pagination
					page={4}
					pageCount={12}
					hrefFor={(page) => `#page-${page}`}
				/>
			</div>
		),
		...DEMO_SOURCES.pagination,
	},

	badge: {
		element: (
			<div className="flex items-center gap-2 wrap justify-center">
				<Badge>plain</Badge>
				<Badge tone="motion">motion</Badge>
				<Badge tone="layout">layout</Badge>
				<Badge tone="content">content</Badge>
				<Badge tone="docs">docs</Badge>
			</div>
		),
		...DEMO_SOURCES.badge,
	},

	kbd: {
		element: (
			<p className="m-0 text-center text-sm fg-dim">
				Press <Kbd>\u2318K</Kbd> to search, <Kbd>esc</Kbd> to close.
			</p>
		),
		...DEMO_SOURCES.kbd,
	},

	separator: {
		element: (
			<div className="max-w-sm">
				<p className="m-0 text-sm">Above the line</p>
				<div className="mt-3 mb-3">
					<Separator />
				</div>
				<div className="flex items-center gap-3 text-sm">
					<span>Left</span>
					<Separator orientation="vertical" decorative />
					<span>Right</span>
				</div>
			</div>
		),
		...DEMO_SOURCES.separator,
	},

	skeleton: {
		element: (
			<div className="max-w-sm flex col gap-3">
				<div className="flex items-center gap-3">
					<Skeleton shape="circle" />
					<div className="flex-1 flex col gap-2">
						<Skeleton shape="line" width="60%" />
						<Skeleton shape="line" width="40%" />
					</div>
				</div>
				<Skeleton shape="block" />
			</div>
		),
		...DEMO_SOURCES.skeleton,
	},

	spinner: {
		element: (
			<div className="flex items-center gap-3 justify-center">
				<Spinner label="Loading the example" />
				<span className="text-sm fg-dim">Loading the example</span>
			</div>
		),
		...DEMO_SOURCES.spinner,
	},

	avatar: {
		element: (
			<div className="flex items-center gap-3 justify-center">
				<Avatar
					name="Ada Lovelace"
					src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&q=60"
					size={40}
				/>
				<Avatar name="Ada Lovelace" size={40} tone="content" />
				<Avatar name="Sushi" size={40} tone="motion" />
			</div>
		),
		...DEMO_SOURCES.avatar,
	},

	"aspect-ratio": {
		element: (
			<div className="max-w-sm w-full">
				<AspectRatio ratio={16 / 9}>
					<img
						src="https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=60"
						alt="A wave, held to a 16:9 crop"
					/>
				</AspectRatio>
			</div>
		),
		...DEMO_SOURCES["aspect-ratio"],
	},

	button: {
		element: (
			<div className="flex items-center gap-3 justify-center">
				<Button>The one action</Button>
				<Button variant="ghost">The alternative</Button>
			</div>
		),
		...DEMO_SOURCES.button,
	},

	empty: {
		element: (
			<div className="max-w-sm w-full">
				<Empty
					title="No posts yet"
					icon="note"
					action={<Button variant="ghost">Write one</Button>}
				>
					Drafts stay off the index until they say otherwise.
				</Empty>
			</div>
		),
		...DEMO_SOURCES.empty,
	},

	item: {
		element: (
			<div className="max-w-sm w-full flex col gap-1">
				<Item
					title="Reveal"
					description="Fades and rises on first sight"
					meta="v0.1.0"
					icon="motion"
					tone="motion"
					href="#reveal"
				/>
				<Item
					title="Grid"
					description="Columns from one number"
					meta="v0.1.0"
					icon="grid"
					tone="layout"
					href="#grid"
				/>
			</div>
		),
		...DEMO_SOURCES.item,
	},

	input: {
		element: (
			<div className="max-w-sm w-full">
				<Input placeholder="What are you looking for?" />
			</div>
		),
		...DEMO_SOURCES["input"],
	},

	textarea: {
		element: (
			<div className="max-w-sm w-full">
				<Textarea placeholder="Say what happened, in order." />
			</div>
		),
		...DEMO_SOURCES["textarea"],
	},

	field: {
		element: (
			<div className="max-w-sm w-full flex col gap-4">
				<Field label="Email" hint="Only for the reply.">
					<Input type="email" placeholder="you@example.com" />
				</Field>
				<Field label="Handle" error="That one is taken.">
					<Input defaultValue="sushi" />
				</Field>
			</div>
		),
		...DEMO_SOURCES["field"],
	},

	checkbox: {
		element: (
			<div className="flex col gap-2">
				<Checkbox label="Ship it" defaultChecked />
				<Checkbox label="Write it down first" />
			</div>
		),
		...DEMO_SOURCES["checkbox"],
	},

	"radio-group": {
		element: (
			<RadioGroup
				label="Theme"
				defaultValue="system"
				options={[
					{ value: "light", label: "Light" },
					{ value: "dark", label: "Dark" },
					{ value: "system", label: "System" },
				]}
			/>
		),
		...DEMO_SOURCES["radio-group"],
	},

	switch: {
		element: (
			<div className="flex col gap-3">
				<Switch label="Smooth scrolling" defaultChecked />
				<Switch label="Reduced motion" />
			</div>
		),
		...DEMO_SOURCES["switch"],
	},

	"native-select": {
		element: (
			<div className="max-w-sm w-full">
				<NativeSelect defaultValue="tanstack">
					<option value="tanstack">TanStack CLI</option>
					<option value="shadcn">shadcn</option>
					<option value="pnpm">pnpm</option>
				</NativeSelect>
			</div>
		),
		...DEMO_SOURCES["native-select"],
	},

	slider: {
		element: (
			<div className="max-w-sm w-full">
				<Slider label="Simplify error" min={0} max={100} defaultValue={35} />
			</div>
		),
		...DEMO_SOURCES["slider"],
	},

	progress: {
		element: (
			<div className="max-w-sm w-full flex col gap-4">
				<Progress label="Uploading the model" value={64} />
				<Progress label="Thinking" />
			</div>
		),
		...DEMO_SOURCES["progress"],
	},

	accordion: {
		element: (
			<div className="max-w-sm w-full">
				<Accordion
					defaultOpen={["why"]}
					items={[
						{
							id: "why",
							title: "Why details?",
							content: "Toggle, keyboard and announcement ship in the element.",
						},
						{
							id: "find",
							title: "Find in page?",
							content: "The browser opens the right panel itself.",
						},
						{
							id: "close",
							title: "Auto-close others?",
							content: "No - that is a radio group in a costume.",
						},
					]}
				/>
			</div>
		),
		...DEMO_SOURCES["accordion"],
	},

	collapsible: {
		element: (
			<div className="max-w-sm w-full">
				<Collapsible summary="The fine print">
					It was one sentence all along.
				</Collapsible>
			</div>
		),
		...DEMO_SOURCES["collapsible"],
	},

	alert: {
		element: (
			<div className="max-w-sm w-full flex col gap-3">
				<Alert title="Note" tone="note">
					The calm default.
				</Alert>
				<Alert title="Caution" tone="caution">
					The one that means it.
				</Alert>
			</div>
		),
		...DEMO_SOURCES["alert"],
	},

	tooltip: {
		element: (
			<p className="m-0 text-center">
				Hover the{" "}
				<Tooltip label="One line, and never any controls">
					<span className="fg-accent">underlined thing</span>
				</Tooltip>{" "}
				to see it.
			</p>
		),
		...DEMO_SOURCES["tooltip"],
	},

	toggle: {
		element: <ToggleDemo />,
		...DEMO_SOURCES["toggle"],
	},

	table: {
		element: (
			<div className="max-w-sm w-full">
				<Table
					caption="Registry items by category"
					rowKey={(row: { name: string }) => row.name}
					columns={[
						{ key: "name", header: "Category", render: (r) => r.name },
						{
							key: "count",
							header: "Items",
							align: "right",
							render: (r: { count: number }) => r.count,
						},
					]}
					rows={[
						{ name: "Motion", count: 6 },
						{ name: "Layout", count: 17 },
						{ name: "Content", count: 24 },
					]}
				/>
			</div>
		),
		...DEMO_SOURCES["table"],
	},

	"scroll-area": {
		element: (
			<div className="max-w-sm w-full">
				<ScrollArea maxHeight="10rem">
					{Array.from({ length: 12 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static demo rows
						<p key={i} className="m-0 text-sm py-2">
							Row {i + 1} of a list taller than its frame
						</p>
					))}
				</ScrollArea>
			</div>
		),
		...DEMO_SOURCES["scroll-area"],
	},

	dialog: {
		element: <DialogDemo />,
		...DEMO_SOURCES["dialog"],
	},

	sheet: {
		element: <SheetDemo />,
		...DEMO_SOURCES["sheet"],
	},

	toast: {
		element: <ToastDemo />,
		...DEMO_SOURCES["toast"],
	},

	typography: {
		element: (
			<div>
				<Label>Eyebrow</Label>
				<Heading as="h3" size="h2">
					A heading, sized apart from its level
				</Heading>
				<Lead>
					The paragraph under a title: dimmed, measured, never full-width.
				</Lead>
			</div>
		),
		...DEMO_SOURCES.typography,
	},

	"code-block": {
		element: (
			<CodeBlock
				code={`export function greet(name: string): string {\n\t// The CLI's colours, on the slab\n\treturn \`hello, \${name}\`;\n}`}
				language="ts"
			/>
		),
		...DEMO_SOURCES["code-block"],
	},

	"copy-button": {
		element: (
			<div className="flex items-center gap-3 justify-center">
				<code className="code">
					pnpm add @sushindustries/ui
					<CopyButton text="pnpm add @sushindustries/ui" ground="paper" />
				</code>
			</div>
		),
		...DEMO_SOURCES["copy-button"],
	},

	reference: {
		element: (
			<p className="m-0 text-center">
				The figure at the top of every component page is a{" "}
				<Ref
					reference={{
						title: "Showcase",
						href: "/components/showcase",
						summary:
							"A component at every width it has to survive, with its source beside it.",
						meta: "@sushindustries/ui · content",
					}}
				>
					Showcase
				</Ref>
				, and hovering the mention tells you so.
			</p>
		),
		...DEMO_SOURCES.reference,
	},

	frontmatter: {
		element: <FrontmatterDemo />,
		poster: <p className="label text-center">Reads the metadata block</p>,
		...DEMO_SOURCES.frontmatter,
	},

	"product-viewer": {
		element: (
			<Suspense
				fallback={<p className="label text-center">Loading the mark</p>}
			>
				<ProductViewer model={LOGO_MODEL} loadingLabel="Loading the mark" />
			</Suspense>
		),
		...DEMO_SOURCES["product-viewer"],
	},
};

export function findDemo(id: string): Demo | undefined {
	return DEMOS[id];
}
