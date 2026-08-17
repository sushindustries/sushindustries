/*
 * The demos' sources, without the demos.
 *
 * Every documentation route needs two facts about a demo - that it exists,
 * and what its code says - and used to import the whole element gallery to
 * get them, which meant the entire component library rode along into every
 * doc page's chunk. That was the slow click on every archive card.
 *
 * This file is strings. `demos.tsx` imports it and adds the elements, so the
 * two cannot drift; only the preview iframe ever pays for the heavy half.
 */

export interface DemoSource {
	readonly source: string;
	readonly language: string;
}

export const DEMO_SOURCES = {
	"scroll-spin": {
		source: `<ScrollSpin revolutions={1.5} tilt={10}>
	<img src="/mark.svg" alt="" />
</ScrollSpin>`,
		language: "tsx",
	},
	reveal: {
		source: `<Reveal delay={80}>
	<Card title="I arrive on scroll" />
</Reveal>`,
		language: "tsx",
	},
	card: {
		source: `<Card title="With meta" meta="v0.1.0">
	<p>Body goes here.</p>
</Card>

<Card title="As a link" href="https://tanstack.com" />`,
		language: "tsx",
	},
	section: {
		source: `<Section id="work" label="Work" title="A section heading">
	<p>Body content.</p>
</Section>`,
		language: "tsx",
	},
	"smooth-scroll": {
		source: `<SmoothScroll />`,
		language: "tsx",
	},
	"doc-aside": {
		source: `<DocAside headings={collectHeadings(markdown)} />`,
		language: "tsx",
	},
	"use-scroll-turn": {
		source: `useScrollTurn(({ turn, wobble }) => {
	node.style.transform = \`rotateY(\${turn * 360}deg)\`;
});`,
		language: "tsx",
	},
	archive: {
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
		source: `useScrollProgress(ref, (progress) => {
	bar.style.transform = \`scaleX(\${progress})\`;
});`,
		language: "tsx",
	},
	"theme-toggle": {
		source: `// It reports the id and stores nothing. A cookie, a server
// function or an account setting are four different answers,
// and a component that picked one would be wrong in three
// codebases out of four.
<ThemeToggle
	options={[
		{ id: "light", label: "Light", icon: "sun" },
		{ id: "dark", label: "Dark", icon: "moon" },
		{ id: "system", label: "System", icon: "contrast" },
	]}
	value={theme}
	onChange={setTheme}
/>`,
		language: "tsx",
	},
	"boot-loader": {
		source: `// \`ready\` is what stops it lying: the count eases to 90 on a
// timer and waits there until the thing it covers has arrived.
<BootLoader ready={modelLoaded} onDone={reveal}>
	<SpinningMark />
</BootLoader>`,
		language: "tsx",
	},
	device: {
		source: `// The machine follows the window: a phone, a tablet from 720px,
// a laptop from 1080px. Nothing here measures anything.
<Device title="sushindustries" wallpaper={<Wallpaper />}>
	<FolderShelf entries={entries} actionsFor={actionsFor} />
</Device>

// Or say which one, and the width stops having an opinion.
<Device kind="tablet">{...}</Device>`,
		language: "tsx",
	},
	"use-device-kind": {
		source: `const kind = useDeviceKind();

// null until mounted, on purpose: the server cannot know, and a
// default would be a claim it cannot support.
<p>{kind ?? "measuring"}</p>`,
		language: "tsx",
	},
	"desk-window": {
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
		source: `<Dock
	tasks={tasks}
	onSelectTask={desk.raise}
	onCloseTask={desk.close}
	onSearch={() => desk.open(SEARCH_PATH)}
	trailing={<Clock />}
/>`,
		language: "tsx",
	},
	"use-desk-state": {
		source: `const desk = useDeskState("my.desk");

desk.open(["applications", "motion"]);
desk.move(id, x, y);
desk.raise(id);`,
		language: "ts",
	},
	"context-menu": {
		source: `const menu = useContextMenu();

<div {...menu.triggerProps}>
	<button {...menu.buttonProps}>Actions</button>
</div>

<ContextMenu state={menu} actions={actions} />`,
		language: "tsx",
	},
	"folder-shelf": {
		source: `<FolderShelf
	entries={shelfEntries()}
	actionsFor={(entry, path) => shelfActions(entry, path)}
/>`,
		language: "tsx",
	},
	grid: {
		source: `<Grid min="14rem" gap={4}>
	<Card title="One" />
	<Card title="Two" />
	<Card title="Three" />
	<Card title="Four" />
</Grid>`,
		language: "tsx",
	},
	spacer: {
		source: `<Spacer size={6} label="Then" />
<Spacer size={5} rule />
<Spacer size={5} />`,
		language: "tsx",
	},
	"nav-bar": {
		source: `<NavBar
	brand={<span className="mono">acme</span>}
	entries={navEntries()}
	trailing={<a href="https://github.com/...">GitHub</a>}
/>`,
		language: "tsx",
	},
	showcase: {
		source: `<Showcase
	src="/preview/card"
	title="Card"
	code={source}
	install={{ shadcn: "pnpm dlx shadcn@latest add .../card.json" }}
/>`,
		language: "tsx",
	},
	clock: {
		source: `<Clock />

<Clock
	options={{ weekday: "long", hour: "2-digit", minute: "2-digit" }}
	every={1000}
/>`,
		language: "tsx",
	},
	credit: {
		source: `<Credit
	name="Lenis"
	by="Darkroom Engineering"
	href="https://lenis.darkroom.engineering"
	role="Smooth scrolling"
/>`,
		language: "tsx",
	},
	"markdown-view": {
		source: `<MarkdownView source={markdown} />`,
		language: "tsx",
	},
	breadcrumb: {
		source: `<Breadcrumb
	origin="https://example.com"
	items={[
		{ label: "Home", href: "/" },
		{ label: "Components", href: "/components" },
		{ label: "Breadcrumb" },
	]}
/>`,
		language: "tsx",
	},
	"command-palette": {
		source: `<CommandPalette
	entries={entries}
	open={open}
	onClose={() => setOpen(false)}
	onSelect={(entry) => navigate(entry.href)}
/>`,
		language: "tsx",
	},
	pagination: {
		source: `<Pagination
	page={page}
	pageCount={12}
	hrefFor={(page) => \`?page=\${page}\`}
/>`,
		language: "tsx",
	},
	badge: {
		source: `<Badge>plain</Badge>
<Badge tone="motion">motion</Badge>`,
		language: "tsx",
	},
	kbd: {
		source: `Press <Kbd>\u2318K</Kbd> to search.`,
		language: "tsx",
	},
	separator: {
		source: `<Separator />
<Separator orientation="vertical" decorative />`,
		language: "tsx",
	},
	skeleton: {
		source: `<Skeleton shape="circle" />
<Skeleton shape="line" width="60%" />
<Skeleton shape="block" />`,
		language: "tsx",
	},
	spinner: {
		source: `<Spinner label="Loading the example" />`,
		language: "tsx",
	},
	avatar: {
		source: `<Avatar name="Ada Lovelace" src={photo} />
<Avatar name="Ada Lovelace" tone="content" />`,
		language: "tsx",
	},
	"aspect-ratio": {
		source: `<AspectRatio ratio={16 / 9}>
	<img src={photo} alt="A wave" />
</AspectRatio>`,
		language: "tsx",
	},
	button: {
		source: `<Button>The one action</Button>
<Button variant="ghost">The alternative</Button>`,
		language: "tsx",
	},
	empty: {
		source: `<Empty title="No posts yet" icon="note"
	action={<Button variant="ghost">Write one</Button>}>
	Drafts stay off the index until they say otherwise.
</Empty>`,
		language: "tsx",
	},
	item: {
		source: `<Item title="Reveal" icon="motion" tone="motion"
	description="Fades and rises on first sight" meta="v0.1.0" />`,
		language: "tsx",
	},
	typography: {
		source: `<Label>Eyebrow</Label>
<Heading as="h3" size="h2">A heading</Heading>
<Lead>The paragraph under it.</Lead>`,
		language: "tsx",
	},
	"code-block": {
		source: `<CodeBlock
	code={source}
	language="ts"
/>`,
		language: "tsx",
	},
	"copy-button": {
		source: `<CopyButton
	text="pnpm add @sushindustries/ui"
	ground="paper"
/>`,
		language: "tsx",
	},
	reference: {
		source: `<Ref reference={{
	title: "Showcase",
	href: "/components/showcase",
	summary: "A component at every width…",
	meta: "@sushindustries/ui",
}}>
	Showcase
</Ref>`,
		language: "tsx",
	},
	frontmatter: {
		source: `const meta = parseFrontmatter(raw);

readString(meta, "title");   // "A post"
readList(meta, "tags");      // ["tanstack", "css"]`,
		language: "ts",
	},
	"product-viewer": {
		source: `const ProductViewer = lazy(() =>
	pacedImport(() => import("@sushindustries/react-product-viewer")),
);

<Suspense fallback={null}>
	<ProductViewer model={LOGO_MODEL} />
</Suspense>`,
		language: "tsx",
	},
} satisfies Readonly<Record<string, DemoSource>>;

export function findDemoSource(id: string): DemoSource | undefined {
	return (DEMO_SOURCES as Readonly<Record<string, DemoSource>>)[id];
}

export function hasDemo(id: string): boolean {
	return id in DEMO_SOURCES;
}
