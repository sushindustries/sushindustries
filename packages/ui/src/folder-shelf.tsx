import { type ReactNode, useState } from "react";
import { ContextMenu, type MenuAction, useContextMenu } from "./context-menu";
import { DeskWindow } from "./desk-window";
import { Icon, type IconName } from "./icon";
import { type DeskApi, useDeskState } from "./use-desk-state";

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
	/** Renders the link for an entry that has an href. */
	renderLink?: (props: {
		id: string;
		href: string;
		className: string;
		children: ReactNode;
	}) => ReactNode;
	/** Announced to screen readers as the name of the shelf. */
	label?: string;
	/** Show the search field. */
	searchable?: boolean;
	/**
	 * Storage key for the arrangement: which windows are open, where they sit,
	 * and what has been put away. Omit and the desk is not remembered.
	 */
	rememberAs?: string;
	/** Placeholder on the search field. */
	searchLabel?: string;
}

function isFolder(entry: ShelfEntry): boolean {
	return Boolean(entry.children && entry.children.length > 0);
}

/*
 * Everything in the tree, flattened, with the path that leads to each thing.
 *
 * Search deliberately looks past the folders. Somebody typing into a desktop is
 * looking for a file, not for the drawer it is in, and a search that only
 * matched top-level folders would answer "Applications" to a query for the name
 * of a component inside it.
 *
 * The path comes back with each result so a match can say where it lives -
 * which is the difference between a result you can trust and a name you have to
 * go and find again.
 */
function flatten(
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

function matches(entry: ShelfEntry, query: string): boolean {
	const haystack = `${entry.label} ${entry.description ?? ""}`.toLowerCase();
	return haystack.includes(query);
}

function glyphFor(entry: ShelfEntry, open = false): IconName {
	if (entry.icon) return entry.icon;
	if (!isFolder(entry)) return "file";
	return open ? "folder-open" : "folder";
}

/*
 * One tile on the shelf, and one row inside a window.
 *
 * Both are a button with a glyph, a name and a menu, so they behave the same
 * under right-click, long press and keyboard regardless of which surface they
 * are on. Two components would drift, and the one that drifts is always the
 * one on the surface you look at less.
 */
function EntryMenu({
	entry,
	path,
	actionsFor,
	className,
}: {
	entry: ShelfEntry;
	path: readonly ShelfEntry[];
	actionsFor: FolderShelfProps["actionsFor"];
	className: string;
}): ReactNode {
	const menu = useContextMenu();
	const actions = actionsFor?.(entry, path) ?? [];

	if (actions.length === 0) return null;

	return (
		<>
			<button
				type="button"
				className={className}
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
	);
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
	renderLink = (props) => <a {...props} />,
	label = "Folders",
	searchable = false,
	searchLabel = "Search",
	rememberAs = "sushindustries.desk",
}: FolderShelfProps): ReactNode {
	const desk = useDeskState(rememberAs);
	const [query, setQuery] = useState("");

	const trimmed = query.trim().toLowerCase();

	/*
	 * Results replace the shelf rather than opening a window over it. A search
	 * that produced a window would need dismissing before the query could be
	 * refined, which is the wrong shape for something typed a character at a
	 * time.
	 */
	const results = trimmed
		? flatten(entries).filter(({ entry }) => matches(entry, trimmed))
		: [];

	/*
	 * Stored windows, resolved against the tree as it is now. Anything that no
	 * longer resolves is dropped rather than repaired: the alternative is a
	 * window titled after a folder that is not there.
	 */
	const open = desk.desk.windows
		.map((entry) => ({ state: entry, path: resolve(entries, entry.path) }))
		.filter(
			(entry): entry is { state: typeof entry.state; path: ShelfEntry[] } =>
				entry.path !== null && entry.path.length > 0,
		);

	const shown = entries.filter((entry) => !desk.desk.hidden.includes(entry.id));

	function openEntry(entry: ShelfEntry, at: readonly ShelfEntry[] = []): void {
		if (!isFolder(entry)) return;
		desk.open([...at.map((step) => step.id), entry.id]);
	}

	return (
		<div className="shelf-root">
			{searchable ? (
				<div className="shelf-search">
					<Icon name="search" size={15} className="shelf-search-glyph" />
					<input
						type="search"
						className="shelf-search-input"
						placeholder={searchLabel}
						aria-label={searchLabel}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					{trimmed ? (
						<span className="mono text-xs fg-faint">
							{results.length} {results.length === 1 ? "result" : "results"}
						</span>
					) : null}
				</div>
			) : null}

			{trimmed ? (
				<ul
					className="window-list shelf-results"
					aria-label={`${label}, filtered`}
				>
					{results.map(({ entry, path: at }) => (
						<li key={`${at.map((step) => step.id).join("/")}/${entry.id}`}>
							<WindowRow
								entry={entry}
								path={at}
								onOpen={() => openEntry(entry, at)}
								actionsFor={actionsFor}
								renderLink={renderLink}
								where={at.map((step) => step.label).join(" / ")}
							/>
						</li>
					))}
					{results.length === 0 ? (
						<li className="p-6 text-center label">Nothing matches that</li>
					) : null}
				</ul>
			) : (
				<ul className="shelf" aria-label={label}>
					{shown.map((entry) => (
						<li key={entry.id} className="shelf-cell">
							<ShelfTile
								entry={entry}
								onOpen={() => openEntry(entry)}
								actionsFor={actionsFor}
								renderLink={renderLink}
							/>
						</li>
					))}
				</ul>
			)}

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
			 * Escape and focus are done by hand below. The stacking is the `z` each
			 * window carries, which is also what makes front-to-back survive a
			 * reload.
			 */}
			{open.map(({ state, path }) => (
				<DeskWindow
					key={state.id}
					title={path.at(-1)?.label ?? ""}
					label={`${path.at(-1)?.label} window`}
					x={state.x}
					y={state.y}
					z={state.z}
					onMove={(x, y) => desk.move(state.id, x, y)}
					onClose={() => desk.close(state.id)}
					onRaise={() => desk.raise(state.id)}
				>
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
						renderLink={renderLink}
					/>
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
}: {
	entry: ShelfEntry;
	onOpen: () => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
	/** Where this tile sits, so its menu can say so. */
	path?: readonly ShelfEntry[];
}): ReactNode {
	const menu = useContextMenu();
	const actions = actionsFor?.(entry, path) ?? [];

	const face = (
		<>
			<span className="shelf-glyph">
				<Icon name={glyphFor(entry)} size={40} />
				{entry.children ? (
					<span className="shelf-count">{entry.children.length}</span>
				) : null}
			</span>
			<span className="shelf-name">{entry.label}</span>
			{entry.description ? (
				<span className="shelf-note">{entry.description}</span>
			) : null}
		</>
	);

	return (
		<div className="relative h-full" {...menu.triggerProps}>
			{isFolder(entry) ? (
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

function WindowBody({
	path,
	onNavigate,
	onOpen,
	actionsFor,
	renderLink,
}: {
	path: readonly ShelfEntry[];
	onNavigate: (path: readonly ShelfEntry[]) => void;
	onOpen: (entry: ShelfEntry) => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
}): ReactNode {
	const current = path.at(-1);
	if (!current) return null;

	const contents = current.children ?? [];

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
				{contents.length === 0 ? (
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

function WindowRow({
	entry,
	path,
	onOpen,
	actionsFor,
	renderLink,
	where,
}: {
	entry: ShelfEntry;
	path: readonly ShelfEntry[];
	onOpen: () => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
	/** Where this row lives, shown only in search results. */
	where?: string;
}): ReactNode {
	const menu = useContextMenu();

	const face = (
		<>
			<span className="window-icon">
				<Icon name={glyphFor(entry)} size={18} />
			</span>
			<span className="min-w-0">
				<span className="block fg text-sm font-medium">{entry.label}</span>
				{where ? <span className="window-where">{where}</span> : null}
				{entry.description ? (
					<span className="window-note">{entry.description}</span>
				) : null}
			</span>
			{entry.meta ? <span className="window-meta">{entry.meta}</span> : null}
			{isFolder(entry) ? (
				<Icon name="chevron" size={13} className="window-into" />
			) : null}
		</>
	);

	return (
		<div className="window-row" {...menu.triggerProps}>
			{isFolder(entry) ? (
				<button type="button" className="window-face" onClick={onOpen}>
					{face}
				</button>
			) : (
				renderLink({
					id: entry.id,
					href: entry.href ?? "#",
					className: "window-face",
					children: face,
				})
			)}

			<EntryMenu
				entry={entry}
				path={path}
				actionsFor={actionsFor}
				className="window-more"
			/>
		</div>
	);
}
