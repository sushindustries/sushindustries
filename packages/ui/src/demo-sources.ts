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
	icon: {
		source: `import { Icon, type IconName } from "@sushindustries/ui";

<Icon name="folder-open" />
<Icon name="search" size={20} />`,
		language: "tsx",
	},
	consent: {
		source: `const [status, setStatus] = useState("pending")

<Consent
	open={status === "pending"}
	onAccept={() => setStatus("granted")}
	onDecline={() => setStatus("denied")}
>
	I measure page views to see what is worth writing
	more of. Nothing personal, nothing sold.
</Consent>`,
		language: "tsx",
	},
	"product-variants": {
		source: `const [variant, setVariant] = useState("Original")

// One canvas. The names come from the model's own
// KHR_materials_variants, not from four files.
<ProductViewer
	model="/models/logo.glb"
	variants={[variant]}
	scroll="page"
/>

{["Original", "White", "Black", "Nothing"].map((name) => (
	<button key={name} onClick={() => setVariant(name)}>
		{name}
	</button>
))}`,
		language: "tsx",
	},
	"typed-mark": {
		source: `<TypedMark text="sushi industries" />

{/* offset moves where the colour cycle starts */}
<TypedMark text="one class, one job" offset={4} />`,
		language: "tsx",
	},
	questions: {
		source: `<Questions
	heading="Common questions"
	questions={[
		"How do I install a component?",
		"Do I need the whole library?",
		"What happens when a component updates?",
	]}
	onAsk={(question) => assistant.send(question)}
/>`,
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
	"doc-nav": {
		source: `{/* Sections come from the loader; the router owns the link. */}
<DocNav
	sections={sections}
	active={slug}
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
/>`,
		language: "tsx",
	},
	hero: {
		source: `{/* The head of a documentation page. */}
<Hero
	trail={<Breadcrumb items={trail} />}
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
		alt: "Avatar, on a laptop",
		aspect: "16 / 10",
		sources: [
			{ src: "/shots/avatar-phone.webp", width: 352 },
			{ src: "/shots/avatar-tablet.webp", width: 640 },
			{ src: "/shots/avatar-laptop.webp", width: 960 },
		],
	}}
	actions={
		<>
			<Button href="/components/avatar/get-started" variant="ghost">
				Docs
			</Button>
			<CopyButton text={prompt} label="Copy prompt" icon="spark" ground="accent" />
		</>
	}
/>

{/* The same component at the top of the home page. */}
<Hero
	variant="landing"
	title="Sushindustries"
	summary="Check what I am building. Small packages, made to be used."
	media={<LogoModel />}
	actions={<Button href="/components">Browse the components</Button>}
/>`,
		language: "tsx",
	},
	"video-player": {
		source: `<VideoPlayer
	title="Never Gonna Give You Up"
	provider="youtube"
	poster="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
	variant="inline"
>
	{/* Mounted on play, unmounted on stop. Nothing loads before that. */}
	<iframe
		src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
		title="Never Gonna Give You Up"
		allow="autoplay; encrypted-media; picture-in-picture"
		allowFullScreen
	/>
</VideoPlayer>`,
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
	"secret-reveal": {
		source: `<SecretReveal
	value="aj_0Q8mWm4Nn2rTgq0v3xJd7YbK1sPzR6cH"
	label="Copy the token"
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
	accordion: {
		source: `<Accordion defaultOpen={["why"]} items={[
	{ id: "why", title: "Why details?", content: "..." },
]} />`,
		language: "tsx",
	},
	alert: {
		source: `<Alert title="Caution" tone="caution">
	The one that means it.
</Alert>`,
		language: "tsx",
	},
	checkbox: {
		source: `<Checkbox label="Ship it" defaultChecked />`,
		language: "tsx",
	},
	collapsible: {
		source: `<Collapsible summary="The fine print">
	It was one sentence all along.
</Collapsible>`,
		language: "tsx",
	},
	dialog: {
		source: `<Dialog open={open} onClose={() => setOpen(false)}
	title="Delete the draft?"
	footer={<>
		<Button variant="ghost" onClick={() => setOpen(false)}>Keep it</Button>
		<Button onClick={confirm}>Delete</Button>
	</>}>
	It has been three weeks.
</Dialog>`,
		language: "tsx",
	},
	field: {
		source: `<Field label="Email" hint="Only for the reply.">
	<Input type="email" />
</Field>
<Field label="Handle" error="That one is taken.">
	<Input defaultValue="sushi" />
</Field>`,
		language: "tsx",
	},
	input: {
		source: `<Input placeholder="What are you looking for?" />`,
		language: "tsx",
	},
	"native-select": {
		source: `<NativeSelect defaultValue="tanstack">
	<option value="tanstack">TanStack CLI</option>
	<option value="shadcn">shadcn</option>
</NativeSelect>`,
		language: "tsx",
	},
	progress: {
		source: `<Progress label="Uploading the model" value={64} />
<Progress label="Thinking" />`,
		language: "tsx",
	},
	"radio-group": {
		source: `<RadioGroup label="Theme" defaultValue="system"
	options={[
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
		{ value: "system", label: "System" },
	]}
/>`,
		language: "tsx",
	},
	"scroll-area": {
		source: `<ScrollArea maxHeight="10rem">
	{rows.map((row) => <Row key={row.id} {...row} />)}
</ScrollArea>`,
		language: "tsx",
	},
	sheet: {
		source: `<Sheet open={open} onClose={() => setOpen(false)} title="Filters">
	<Field label="Category">…</Field>
</Sheet>`,
		language: "tsx",
	},
	slider: {
		source: `<Slider label="Simplify error" min={0} max={100} defaultValue={35} />`,
		language: "tsx",
	},
	switch: {
		source: `<Switch label="Smooth scrolling" defaultChecked />`,
		language: "tsx",
	},
	"bar-chart": {
		source: `<BarChart
	label="Tokens per document kind"
	description="Source files are two thirds of the index."
	rows={rows}
	colorByCategory
/>`,
		language: "tsx",
	},
	"data-table": {
		source: `<DataTable
	label="Documents by kind"
	sortBy="tokens"
	descending
	rows={rows}
	columns={[
		{ id: "kind", header: "Kind", sortable: true },
		{ id: "files", header: "Files", numeric: true, sortable: true },
		{ id: "tokens", header: "Tokens", numeric: true, sortable: true },
	]}
/>`,
		language: "tsx",
	},
	"dropdown-menu": {
		source: `<DropdownMenu
	label="Actions"
	icon="terminal"
	align="end"
	items={[
		{ id: "open", label: "Open on the site", icon: "link" },
		{ id: "retitle", label: "Change title…", icon: "text" },
		{ id: "remove", label: "Remove…", icon: "close", destructive: true },
	]}
	onSelect={(id) => run(id)}
/>`,
		language: "tsx",
	},
	workbench: {
		source: `<Workbench
	title="documents"
	label="Every document in the index"
	maxHeight="20rem"
	toolbar={<Button>New</Button>}
	rail={<Filters />}
	status={<span className="workbench-stat"><b>50</b> of <b>1,240</b></span>}
>
	<DocumentList />
</Workbench>`,
		language: "tsx",
	},
	table: {
		source: `<Table rowKey={(r) => r.name}
	columns={[
		{ key: "name", header: "Category", render: (r) => r.name },
		{ key: "count", header: "Items", align: "right", render: (r) => r.count },
	]}
	rows={rows}
/>`,
		language: "tsx",
	},
	textarea: {
		source: `<Textarea placeholder="Say what happened, in order." />`,
		language: "tsx",
	},
	toast: {
		source: `const { toast } = useToast();

<Button onClick={() => toast("Copied the command")}>
	Do the thing
</Button>`,
		language: "tsx",
	},
	toggle: {
		source: `<ToggleGroup label="View" value={view} onChange={setView}
	options={[
		{ value: "preview", label: "Preview" },
		{ value: "code", label: "Code" },
	]}
/>`,
		language: "tsx",
	},
	tooltip: {
		source: `<Tooltip label="One line, never any controls">
	<span>the underlined thing</span>
</Tooltip>`,
		language: "tsx",
	},
} satisfies Readonly<Record<string, DemoSource>>;

export function findDemoSource(id: string): DemoSource | undefined {
	return (DEMO_SOURCES as Readonly<Record<string, DemoSource>>)[id];
}

export function hasDemo(id: string): boolean {
	return id in DEMO_SOURCES;
}
