import { type ReactNode, useEffect, useRef } from "react";
import { ContextMenu, type MenuAction, useContextMenu } from "./context-menu";
import { DeskWindow } from "./desk-window";
import { Icon, type IconName } from "./icon";
import {
	type DeskApi,
	type DeskIconState,
	useDeskState,
} from "./use-desk-state";
import { useDragPlace } from "./use-drag-place";

/** `useDragPlace` needs a callback; `enabled: false` means it is never called. */
function noop(): void {}

/*
 * Both handler sets, run in order.
 *
 * The context menu and the drag both want `onPointerDown`, `onPointerMove`,
 * `onPointerUp` and `onPointerCancel` on the same element, and spreading one
 * after the other silently keeps only the last - which is how the long-press
 * menu stopped existing on touch while right-click carried on working and
 * nothing looked wrong.
 *
 * Written out rather than merged by a loop: there are four of them, they are
 * all the same shape, and a generic merge would have to lie about the types.
 */
function bothPointers<T extends React.PointerEvent<HTMLElement>>(
	first: (event: T) => void,
	second: (event: T) => void,
): (event: T) => void {
	return (event) => {
		first(event);
		second(event);
	};
}

/**
 * Stored cells resolved against the desk that actually exists.
 *
 * Two things go wrong between storing a cell and drawing it, and both of them
 * go wrong silently.
 *
 * **The column count changes.** An arrangement made on a laptop has icons in
 * column six, and a phone has three columns. Left alone they would be placed
 * outside the grid, where CSS puts them in an implicit column that nothing else
 * knows about and the desk quietly grows a horizontal scrollbar.
 *
 * **Two icons want one cell.** Which cannot be prevented at drop time either,
 * because the collision may not exist until the column count changes and folds
 * two of them together. Grid would draw both, overlapping, and the one
 * underneath becomes unclickable.
 *
 * So: walk the placed icons in a stable order, clamp each into range, and give
 * a displaced one the next free cell reading order-wise. Stable order matters -
 * resolving in `Object.keys` order would rearrange somebody's desk differently
 * on a reload for no reason they could see.
 *
 * Icons nobody has placed are deliberately absent from the result. They are
 * left to the grid's own auto-placement, which already skips cells taken by
 * explicitly placed items - so the default arrangement stays responsive and
 * this function stays small.
 */
export function arrange(
	entries: readonly ShelfEntry[],
	icons: Readonly<Record<string, DeskIconState>>,
	columns: number,
): Map<string, DeskIconState> {
	const out = new Map<string, DeskIconState>();
	const taken = new Set<string>();
	const width = Math.max(1, columns);

	for (const entry of entries) {
		const wanted = icons[entry.id];
		if (!wanted) continue;

		let col = Math.min(width - 1, Math.max(0, wanted.col));
		let row = Math.max(0, wanted.row);

		// The next free cell in reading order. Bounded by construction: each pass
		// advances, and rows are unbounded downward, so it always terminates.
		while (taken.has(`${col},${row}`)) {
			col += 1;
			if (col >= width) {
				col = 0;
				row += 1;
			}
		}

		taken.add(`${col},${row}`);
		out.set(entry.id, { col, row });
	}

	return out;
}

export interface ShelfEntry {
	readonly id: string;
	readonly label: string;
	/** One line, shown under the name inside an open window. */
	readonly description?: string;
	/** Where an entry with no children goes when opened. */
	readonly href?: string;
	/** Shown right-aligned in a window row. A count, a version, a size. */
	readonly meta?: string;
	/** Overrides the default folder or file glyph. */
	readonly icon?: IconName;
	/**
	 * Drawn instead of the glyph.
	 *
	 * For the one icon in a set that earns it - a live mark, a preview, a
	 * thumbnail. A `ReactNode` rather than an image URL because whatever goes in
	 * here is the consumer's, and the shelf has no business knowing whether it
	 * is an `<img>` or a WebGL canvas.
	 *
	 * Use it once. A desktop where every icon is bespoke is not a desktop, it is
	 * a gallery, and the reason a folder is recognisable is that it looks like
	 * the folder next to it.
	 */
	readonly art?: ReactNode;
	/** Present and non-empty makes it a folder. Absent makes it a thing. */
	readonly children?: readonly ShelfEntry[];
}

export interface FolderShelfProps {
	readonly entries: readonly ShelfEntry[];
	/**
	 * The menu for an entry, built by the consumer.
	 *
	 * This component knows how to summon a menu and where to put it. It does
	 * not know what "save as Markdown" means, and it should not: the actions
	 * are about the host's content, and a shelf that hard-coded them could only
	 * ever list one kind of thing.
	 */
	actionsFor?: (entry: ShelfEntry, path: readonly ShelfEntry[]) => MenuAction[];
	/** Text in the search window's field. Controlled by the consumer. */
	query?: string;
	onQuery?: (query: string) => void;
	/** What a search result does when chosen. */
	onChoose?: (entry: ShelfEntry, path: readonly ShelfEntry[]) => void;
	/**
	 * Renders a leaf's page, to be shown in a window rather than navigated to.
	 *
	 * Return nothing and the leaf stays a link, which is the right default -
	 * this component has no idea what is at the other end of an href. Return
	 * something and the desktop stops being a directory of somewhere else and
	 * becomes the place the content is.
	 */
	renderEntry?: (entry: ShelfEntry) => ReactNode;
	/** Renders the link for an entry that has an href. */
	renderLink?: (props: {
		id: string;
		href: string;
		className: string;
		children: ReactNode;
	}) => ReactNode;
	/** Announced to screen readers as the name of the shelf. */
	label?: string;
	/**
	 * Storage key for the arrangement: which windows are open, where they sit,
	 * and what has been put away.
	 *
	 * Only used when `desk` is not supplied.
	 */
	rememberAs?: string;
	/**
	 * An existing desk to render, rather than one of its own.
	 *
	 * Supply this whenever something outside also needs to open, close or list
	 * windows - a dock, most obviously. Two `useDeskState` calls with the same
	 * storage key are not one desk shared: they are two Reacts states that
	 * happen to write to the same place, so opening a window through one leaves
	 * the other still rendering the desk it last knew about.
	 *
	 * That is not hypothetical. The dock's search button wrote to the site's
	 * desk and the shelf kept rendering its own, so pressing search added a
	 * task to the dock and put no window on screen.
	 */
	desk?: DeskApi;
	/**
	 * How many cells across the desktop is.
	 *
	 * Passed rather than measured, so the server and the client agree about the
	 * arrangement on the first paint. On this site it comes from `devices.md`
	 * via `useDeviceKind`, which is the same table the stylesheet's
	 * `--device-columns` is compiled from.
	 *
	 * Only the top-level shelf uses it. Icons inside a window are never placed,
	 * so a window never needs to know.
	 */
	columns?: number;
}

/**
 * The path a search window occupies.
 *
 * A reserved id rather than a separate list of open panels, so search is a
 * window like any other: dragged, resized, raised, closed and remembered by
 * exactly the same code. A second mechanism for "a thing on the desk" would be
 * a second set of bugs, and the one nobody uses is the one that rots.
 *
 * The null character cannot appear in a real entry id, which is what makes it
 * safe as a sentinel rather than merely unlikely.
 */
export const SEARCH_PATH: readonly string[] = ["\u0000search"];

function isSearch(path: readonly string[]): boolean {
	return path[0] === SEARCH_PATH[0];
}

function isFolder(entry: ShelfEntry): boolean {
	return Boolean(entry.children && entry.children.length > 0);
}

/**
 * Everything in the tree, flattened, with the path that leads to each thing.
 *
 * Exported because search belongs to whatever is doing the searching - on this
 * site the dock's palette - and every one of them needs this same walk.
 *
 * Search should look past the folders: somebody typing into a desktop is
 * looking for a file, not for the drawer it is in, and a search that only
 * matched top-level folders would answer "Components" to a query for the name
 * of a component inside it. The path comes back with each result so a match can
 * say where it lives, which is the difference between a result you can trust
 * and a name you have to go and find again.
 */
export function flatten(
	entries: readonly ShelfEntry[],
	path: readonly ShelfEntry[] = [],
): Array<{ entry: ShelfEntry; path: readonly ShelfEntry[] }> {
	return entries.flatMap((entry) => [
		{ entry, path },
		...flatten(entry.children ?? [], [...path, entry]),
	]);
}

/*
 * A stored path of ids, resolved back to entries.
 *
 * Returns null when any step has gone - a component renamed, a package
 * removed - so a remembered window onto something that no longer exists
 * quietly does not reopen instead of restoring an empty frame.
 */
function resolve(
	entries: readonly ShelfEntry[],
	ids: readonly string[],
): ShelfEntry[] | null {
	const out: ShelfEntry[] = [];
	let level = entries;

	for (const id of ids) {
		const found = level.find((entry) => entry.id === id);
		if (!found) return null;

		out.push(found);
		level = found.children ?? [];
	}

	return out;
}

/** Label and description, case-folded. The whole matching rule. */
export function matches(entry: ShelfEntry, query: string): boolean {
	const haystack = `${entry.label} ${entry.description ?? ""}`.toLowerCase();
	return haystack.includes(query.trim().toLowerCase());
}

function glyphFor(entry: ShelfEntry, open = false): IconName {
	if (entry.icon) return entry.icon;
	if (!isFolder(entry)) return "file";
	return open ? "folder-open" : "folder";
}

/*
 * A shelf of folders, and a window that opens on top of it.
 *
 * The window is a real `<dialog>` opened with `showModal()`, which is what
 * gets focus trapping, `Escape`, inertness of the page behind it and the
 * top-layer stacking that means no z-index in this file has to be correct
 * relative to anything else on the page. Rebuilding those four things by hand
 * is most of a week and all of them are already in the browser.
 *
 * Inside, navigation is a stack rather than routes. A window is a transient
 * view of a tree; putting it in the URL would mean every folder anyone ever
 * opened is a page that has to exist, and closing the window would leave the
 * address bar describing something that is no longer on screen.
 */
export function FolderShelf({
	entries,
	actionsFor,
	renderEntry,
	query = "",
	onQuery,
	onChoose,
	renderLink = (props) => <a {...props} />,
	label = "Folders",
	rememberAs = "sushindustries.desk",
	desk: given,
	columns = 4,
}: FolderShelfProps): ReactNode {
	/*
	 * The hook runs either way - hooks cannot be called conditionally - and its
	 * result is discarded when a desk was supplied. One unused subscription is a
	 * cheaper price than two code paths.
	 */
	const own = useDeskState(rememberAs);
	const desk = given ?? own;

	/*
	 * Stored windows, resolved against the tree as it is now. Anything that no
	 * longer resolves is dropped rather than repaired: the alternative is a
	 * window titled after a folder that is not there.
	 */
	const open = desk.desk.windows
		// A minimised window is still open - it just is not on the desk. The dock
		// is where it went, and the dock reads `desk.windows` directly.
		.filter((entry) => !entry.minimised)
		.map((entry) => ({
			state: entry,
			search: isSearch(entry.path),
			path: isSearch(entry.path) ? [] : resolve(entries, entry.path),
		}))
		.filter(
			(
				entry,
			): entry is {
				state: typeof entry.state;
				search: boolean;
				path: ShelfEntry[];
			} => entry.search || (entry.path !== null && entry.path.length > 0),
		);

	/*
	 * Escape closes the front window.
	 *
	 * The note by the window list has said this was "done by hand below" for as
	 * long as these have not been `<dialog>`s, and nothing ever did it: giving
	 * up `showModal()` to get a desk that stacks also gave up the Escape that
	 * came free with it, and the only way out became the close button.
	 *
	 * The front window only, one per press. That is what a desktop does - the
	 * key closes what you are looking at, not everything you have ever opened -
	 * and it leaves a second press meaning the next one down.
	 */
	const close = desk.close;
	const frontId = open.reduce<{ id: string; z: number } | undefined>(
		(front, entry) =>
			front === undefined || entry.state.z > front.z
				? { id: entry.state.id, z: entry.state.z }
				: front,
		undefined,
	)?.id;

	useEffect(() => {
		if (frontId === undefined) return;
		/* Captured after the guard: the handler is hoisted, so it cannot see
		 * the narrowing that happened above it. */
		const id = frontId;

		function onKeyDown(event: KeyboardEvent): void {
			if (event.key !== "Escape" || event.defaultPrevented) return;

			/*
			 * A modal owns Escape while it is open. The command palette and the
			 * dialogs are real `<dialog>`s, so one being open means the key was
			 * aimed at it, and taking a window away behind it would be two
			 * things happening from one press.
			 */
			if (document.querySelector("dialog[open]")) return;

			/*
			 * Not while typing. Escape in the search field or the composer means
			 * "drop what I am entering"; closing the window it lives in throws
			 * away the rest of the window to answer a smaller question.
			 */
			const target = event.target;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target instanceof HTMLSelectElement ||
				(target instanceof HTMLElement && target.isContentEditable)
			) {
				return;
			}

			close(id);
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [frontId, close]);

	const results = query.trim()
		? flatten(entries).filter(({ entry }) => matches(entry, query))
		: [];

	const shown = entries.filter((entry) => !desk.desk.hidden.includes(entry.id));

	/*
	 * How many cells across the desk is, read from the machine.
	 *
	 * The stylesheet sets `--device-columns` per machine from `devices.md`, and
	 * this is the same number as a value - needed because snapping a drop to a
	 * cell is arithmetic, and because `arrange` cannot clamp a column into a
	 * grid whose width it does not know.
	 *
	 * `columns` is a prop rather than a measurement so that the server renders
	 * the same desk the client does. Measuring would mean a first paint with no
	 * arrangement at all.
	 */
	const placed = arrange(shown, desk.desk.icons, columns);

	/*
	 * A folder opens a window onto its contents; a leaf opens a window onto its
	 * page, when the consumer can render one. A leaf with no renderer stays a
	 * link and is handled by the anchor itself, never reaching here.
	 */
	function openEntry(entry: ShelfEntry, at: readonly ShelfEntry[] = []): void {
		if (!isFolder(entry) && !renderEntry) return;
		desk.open([...at.map((step) => step.id), entry.id]);
	}

	return (
		<div className="shelf-root">
			{/*
			 * The desktop's own grid, which icons can be dragged out of.
			 *
			 * An icon nobody has moved stays in the grid and reflows with it, so the
			 * default arrangement is still responsive and still has a column count
			 * per machine. An icon somebody has placed is taken out of flow and
			 * pinned where it was put - which is how a real desktop behaves, and it
			 * means the grid closes up behind it rather than keeping a hole.
			 */}
			<ul className="shelf" aria-label={label}>
				{shown.map((entry) => {
					const cell = placed.get(entry.id);

					return (
						<li
							key={entry.id}
							className="shelf-cell"
							data-placed={cell ? "true" : undefined}
							style={
								cell
									? /*
										 * Grid lines are one-based, cells here are zero-based, and
										 * the icon stays a grid item either way. That is the whole
										 * reason this works: an item placed on a line cannot leave
										 * the grid, and the grid will not auto-place anything else
										 * on a cell that is explicitly claimed.
										 */
										({
											gridColumn: cell.col + 1,
											gridRow: cell.row + 1,
										} as React.CSSProperties)
									: undefined
							}
						>
							<ShelfTile
								entry={entry}
								onOpen={() => openEntry(entry)}
								actionsFor={actionsFor}
								renderLink={renderLink}
								openable={Boolean(renderEntry)}
								onPlace={(col, row) => desk.place(entry.id, col, row)}
								columns={columns}
							/>
						</li>
					);
				})}
			</ul>

			{/*
			 * Windows live here, absolutely positioned inside the desk rather than
			 * portalled to the body.
			 *
			 * They were a `<dialog>` opened with `showModal()`, which is the better
			 * answer for a modal on a page - focus trapping, Escape and top-layer
			 * stacking, all free. It is the wrong answer for a desktop: a modal
			 * goes to the top layer by definition, so it covers the browser window
			 * rather than the screen it belongs to, and only one can be open.
			 *
			 * So Escape is bound by hand instead, in the effect above, and it
			 * closes the front window only. The stacking is the `z` each window
			 * carries, which is also what makes front-to-back survive a reload
			 * and what "front" means when the key is pressed.
			 */}
			{open.map(({ state, path, search }) => (
				<DeskWindow
					key={state.id}
					title={search ? "Search" : (path.at(-1)?.label ?? "")}
					label={search ? "Search window" : `${path.at(-1)?.label} window`}
					x={state.x}
					y={state.y}
					z={state.z}
					w={state.w}
					h={state.h}
					onMove={(x, y) => desk.move(state.id, x, y)}
					onResize={(w, h) => desk.resize(state.id, w, h)}
					onClose={() => desk.close(state.id)}
					onRaise={() => desk.raise(state.id)}
				>
					{search ? (
						<SearchBody
							query={query}
							onQuery={onQuery}
							results={results}
							onChoose={(entry, at) => {
								onChoose?.(entry, at);
								desk.close(state.id);
							}}
						/>
					) : (
						<WindowBody
							path={path}
							onNavigate={(next) =>
								desk.navigate(
									state.id,
									next.map((step) => step.id),
								)
							}
							onOpen={(entry) => openEntry(entry, path)}
							actionsFor={actionsFor}
							renderEntry={renderEntry}
							renderLink={renderLink}
						/>
					)}
				</DeskWindow>
			))}
		</div>
	);
}

/** The desk's own API, for a dock or a menu that needs to reach it. */
export type { DeskApi };

function ShelfTile({
	entry,
	onOpen,
	actionsFor,
	renderLink,
	path = [],
	openable = false,
	onPlace,
	columns = 4,
}: {
	entry: ShelfEntry;
	onOpen: () => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
	/** Where this tile sits, so its menu can say so. */
	path?: readonly ShelfEntry[];
	/** A leaf whose page can be shown in a window rather than navigated to. */
	openable?: boolean;
	/** Given, the tile can be dragged and this is the cell it landed on. */
	onPlace?: (col: number, row: number) => void;
	/** How many cells across the grid it is in is, for snapping a drop. */
	columns?: number;
}): ReactNode {
	const menu = useContextMenu();
	const actions = actionsFor?.(entry, path) ?? [];

	/*
	 * Only the desktop passes `onPlace`, so only the desktop's icons drag.
	 *
	 * Inside a window they stay a grid on purpose: a window is a box somebody
	 * resizes by hand, and icons pinned by percentage inside one would slide
	 * around every time its corner was pulled. Free placement is a property of
	 * a desktop, not of a folder listing.
	 */
	const drag = useDragPlace({
		onPlace: onPlace ?? noop,
		columns,
		enabled: Boolean(onPlace),
	});

	/*
	 * The menu's handlers and the drag's, composed rather than stacked.
	 *
	 * Both want `onPointerDown`, `onPointerMove`, `onPointerUp` and
	 * `onPointerCancel` on this element. Spreading one after the other keeps
	 * only the last, silently, which is how the long-press menu stopped existing
	 * on touch while right-click carried on working and nothing looked wrong.
	 */
	const tile = {
		onContextMenu: menu.triggerProps.onContextMenu,
		onPointerDown: bothPointers(
			menu.triggerProps.onPointerDown,
			drag.handleProps.onPointerDown,
		),
		onPointerMove: bothPointers(
			menu.triggerProps.onPointerMove,
			drag.handleProps.onPointerMove,
		),
		onPointerUp: bothPointers(
			menu.triggerProps.onPointerUp,
			drag.handleProps.onPointerUp,
		),
		onPointerCancel: bothPointers(
			menu.triggerProps.onPointerCancel,
			drag.handleProps.onPointerCancel,
		),
		onClickCapture: drag.handleProps.onClickCapture,
	};

	const face = (
		<>
			<span className="shelf-glyph">
				{entry.art ?? <Icon name={glyphFor(entry)} size={40} />}
				{/*
				 * `isFolder`, not `entry.children`.
				 *
				 * An empty array is truthy, and the Markdown parser gives every
				 * entry a `children: []` whether or not it has any - so every leaf
				 * on the desktop wore a badge reading `0`. The type already has one
				 * answer for "is this a folder" and this is it; asking the question
				 * a second way is how the two came apart.
				 */}
				{isFolder(entry) ? (
					<span className="shelf-count">{entry.children?.length}</span>
				) : null}
			</span>
			<span className="shelf-name">{entry.label}</span>
			{/*
			 * A folder says what it is by being one. It already carries the
			 * glyph and the count, and a category blurb under that is a third
			 * answer to a question nobody asked twice - it made every folder
			 * tile a different height and the row of them read as debris.
			 *
			 * Leaves keep theirs, because for a leaf the description is the
			 * only thing distinguishing two files with similar names.
			 */}
			{entry.description && !isFolder(entry) ? (
				<span className="shelf-note">{entry.description}</span>
			) : null}
		</>
	);

	return (
		<div
			className="shelf-tile"
			data-art={entry.art ? "true" : undefined}
			{...tile}
		>
			{isFolder(entry) || openable ? (
				<button type="button" className="shelf-face" onClick={onOpen}>
					{face}
				</button>
			) : (
				renderLink({
					id: entry.id,
					href: entry.href ?? "#",
					className: "shelf-face",
					children: face,
				})
			)}

			{actions.length > 0 ? (
				<>
					<button
						type="button"
						className="shelf-more"
						aria-label={`Actions for ${entry.label}`}
						{...menu.buttonProps}
					>
						<Icon name="dots" size={16} />
					</button>
					<ContextMenu
						state={menu}
						actions={actions}
						label={`Actions for ${entry.label}`}
					/>
				</>
			) : null}
		</div>
	);
}

/*
 * The search window's contents: a field and its results.
 *
 * Deliberately rows rather than the icon grid a folder gets. A folder is a
 * place and its contents are things you point at; a result is an answer, and
 * the useful half of it is which folder it came from - which is text, and text
 * under an icon in a grid is a caption nobody reads.
 */
function SearchBody({
	query,
	onQuery,
	results,
	onChoose,
}: {
	query: string;
	onQuery?: (query: string) => void;
	results: ReturnType<typeof flatten>;
	onChoose: (entry: ShelfEntry, path: readonly ShelfEntry[]) => void;
}): ReactNode {
	const fieldRef = useRef<HTMLInputElement>(null);

	/*
	 * Focus the field when the window appears.
	 *
	 * Done in an effect rather than with `autoFocus`, which fires whenever the
	 * element is inserted - including on a server render and on any remount -
	 * and cannot be scoped to "the window somebody just asked for". This runs
	 * once, on the client, when this window mounts.
	 *
	 * Taking focus is right here and would be wrong almost anywhere else: the
	 * window exists because somebody pressed search, and the only reason to
	 * press search is to type.
	 */
	useEffect(() => {
		fieldRef.current?.focus();
	}, []);

	return (
		<div className="window-frame">
			<div className="search-field">
				<Icon name="search" size={15} className="search-glyph" />
				<input
					type="search"
					className="search-input"
					placeholder="Search everything"
					aria-label="Search everything"
					ref={fieldRef}
					value={query}
					onChange={(event) => onQuery?.(event.target.value)}
				/>
				{query.trim() ? (
					<span className="search-count">{results.length}</span>
				) : null}
			</div>

			<ul className="window-canvas search-results">
				{results.map(({ entry, path }) => (
					<li key={[...path.map((step) => step.id), entry.id].join("/")}>
						<button
							type="button"
							className="window-face"
							onClick={() => onChoose(entry, path)}
						>
							<span className="window-icon">
								<Icon name={glyphFor(entry)} size={18} />
							</span>
							<span className="min-w-0">
								<span className="block fg text-sm font-medium">
									{entry.label}
								</span>
								{path.length > 0 ? (
									<span className="window-where">
										{path.map((step) => step.label).join(" / ")}
									</span>
								) : null}
								{entry.description ? (
									<span className="window-note">{entry.description}</span>
								) : null}
							</span>
						</button>
					</li>
				))}

				{results.length === 0 ? (
					<li className="p-6 text-center label">
						{query.trim() ? "Nothing matches that" : "Type to search"}
					</li>
				) : null}
			</ul>
		</div>
	);
}

function WindowBody({
	path,
	onNavigate,
	onOpen,
	actionsFor,
	renderEntry,
	renderLink,
}: {
	path: readonly ShelfEntry[];
	onNavigate: (path: readonly ShelfEntry[]) => void;
	onOpen: (entry: ShelfEntry) => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderEntry?: FolderShelfProps["renderEntry"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
}): ReactNode {
	const current = path.at(-1);
	if (!current) return null;

	const contents = current.children ?? [];
	const page = isFolder(current) ? null : renderEntry?.(current);

	return (
		<div className="window-frame">
			{/*
			 * A path, not a back button. It says where you are as well as how to
			 * leave, and at two levels deep a back button says neither.
			 *
			 * The window's own title bar and close button belong to `DeskWindow`,
			 * so this is only navigation.
			 */}
			<nav className="window-path" aria-label="Path">
				{path.map((entry, index) => (
					<span key={entry.id} className="window-crumb">
						{index > 0 ? (
							<Icon name="chevron" size={12} className="window-sep" />
						) : null}
						<button
							type="button"
							className="window-crumb-button"
							aria-current={index === path.length - 1 ? "true" : undefined}
							onClick={() => onNavigate(path.slice(0, index + 1))}
						>
							{entry.label}
						</button>
					</span>
				))}
			</nav>

			{/*
			 * Icons on a canvas, not rows in a table.
			 *
			 * A window of rows is a file listing, and a file listing is a thing you
			 * read. Icons are a thing you look at and point to, which is what a
			 * folder of components should be - and it is the same grid the desktop
			 * uses, so opening a folder is going deeper into the same place rather
			 * than arriving at a different kind of screen.
			 *
			 * Rows survive for search results, where the answer is "which folder is
			 * it in" and that is text.
			 */}
			<div className="window-canvas">
				{page ? (
					// A page, read here rather than somewhere else. The desktop stops
					// being a directory of the site and becomes where the site is.
					<div className="window-page">{page}</div>
				) : contents.length === 0 ? (
					<p className="p-6 text-center label">Nothing in here yet</p>
				) : (
					<ul className="shelf">
						{contents.map((entry) => (
							<li key={entry.id} className="shelf-cell">
								<ShelfTile
									entry={entry}
									onOpen={() => onOpen(entry)}
									actionsFor={actionsFor}
									renderLink={renderLink}
									path={path}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
