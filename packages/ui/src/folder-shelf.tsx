import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { ContextMenu, type MenuAction, useContextMenu } from "./context-menu";
import { Icon, type IconName } from "./icon";

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
}: FolderShelfProps): ReactNode {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [path, setPath] = useState<readonly ShelfEntry[]>([]);
	const [query, setQuery] = useState("");

	/*
	 * The portal waits for the client, and it waits through an effect rather
	 * than through `typeof document`.
	 *
	 * A `typeof document === "undefined"` branch renders nothing on the server
	 * and a portal on the first client render, which is a hydration mismatch -
	 * React throws the whole tree away and rebuilds it, and in the window where
	 * that happens the folders have no working click handlers. That is what
	 * "the folders do not open" was.
	 *
	 * Gating on state means the first client render matches the server's
	 * exactly, and the portal arrives on the effect afterwards.
	 */
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const current = path.at(-1);
	const trimmed = query.trim().toLowerCase();

	/*
	 * Results replace the shelf rather than opening a window over it. A search
	 * that produced a modal would need dismissing before you could refine the
	 * query, which is the wrong shape for something typed a character at a time.
	 */
	const results = trimmed
		? flatten(entries).filter(({ entry }) => matches(entry, trimmed))
		: [];

	const close = useCallback(() => setPath([]), []);

	/*
	 * The dialog is opened and closed from an effect rather than by rendering
	 * `open`, because `showModal()` is the only thing that puts it in the top
	 * layer. A `<dialog open>` rendered declaratively is a non-modal box with
	 * none of the behaviour that made it worth using.
	 */
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (current && !dialog.open) dialog.showModal();
		if (!current && dialog.open) dialog.close();
	}, [current]);

	function openEntry(entry: ShelfEntry): void {
		if (isFolder(entry)) setPath((stack) => [...stack, entry]);
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
						<span className="shelf-search-count">
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
								onOpen={() => setPath([...at, entry])}
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
					{entries.map((entry) => (
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
			 * Portalled to the body, and this is not optional.
			 *
			 * `showModal()` promotes a dialog to the top layer, which is supposed
			 * to free it from ancestor clipping and stacking. It does not free it
			 * from an ancestor `transform` or `preserve-3d`: those establish a
			 * containing block, and a modal inside one lands somewhere nobody
			 * asked for or does not paint at all. This shelf is mounted inside a
			 * laptop lid that is rotated on every scroll frame, which is about the
			 * most hostile version of that.
			 *
			 * Rendering it at the body sidesteps the whole question.
			 *
			 * Gated on mounted state rather than on `typeof document`, because a
			 * `typeof` branch renders nothing on the server and a portal on the
			 * first client render - a hydration mismatch, which makes React throw
			 * the tree away and rebuild it, and in that window the folders have no
			 * working click handlers.
			 */}
			{mounted &&
				createPortal(
					<dialog
						ref={dialogRef}
						className="window"
						onCancel={close}
						onClose={close}
						/*
						 * Close on backdrop. A click on the backdrop lands on the dialog
						 * element itself and never on a child, which is the whole trick.
						 *
						 * `onMouseDown` rather than `onClick`, so a selection drag that
						 * starts inside the window and ends outside it does not count as a
						 * click on the backdrop and close the thing you were reading.
						 *
						 * The keyboard equivalent is Escape, which `<dialog>` raises as
						 * `cancel` above - so this is a pointer shortcut for something that
						 * already has a key, not a pointer-only affordance.
						 */
						onMouseDown={(event) => {
							if (event.target === dialogRef.current) close();
						}}
					>
						{current ? (
							<WindowBody
								path={path}
								onNavigate={setPath}
								onOpen={openEntry}
								onClose={close}
								actionsFor={actionsFor}
								renderLink={renderLink}
							/>
						) : null}
					</dialog>,
					document.body,
				)}
		</div>
	);
}

function ShelfTile({
	entry,
	onOpen,
	actionsFor,
	renderLink,
}: {
	entry: ShelfEntry;
	onOpen: () => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
}): ReactNode {
	const menu = useContextMenu();
	const actions = actionsFor?.(entry, []) ?? [];

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
	onClose,
	actionsFor,
	renderLink,
}: {
	path: readonly ShelfEntry[];
	onNavigate: (path: readonly ShelfEntry[]) => void;
	onOpen: (entry: ShelfEntry) => void;
	onClose: () => void;
	actionsFor: FolderShelfProps["actionsFor"];
	renderLink: NonNullable<FolderShelfProps["renderLink"]>;
}): ReactNode {
	const current = path.at(-1);
	if (!current) return null;

	const contents = current.children ?? [];

	return (
		<div className="window-frame">
			<header className="window-bar">
				{/*
				 * A path, not a back button. It says where you are as well as how
				 * to leave, and at two levels deep a back button says neither.
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

				<button
					type="button"
					className="window-close"
					aria-label="Close"
					onClick={onClose}
				>
					<Icon name="close" size={16} />
				</button>
			</header>

			<ul className="window-list">
				{contents.map((entry) => (
					<li key={entry.id} className="window-row-cell">
						<WindowRow
							entry={entry}
							path={path}
							onOpen={() => onOpen(entry)}
							actionsFor={actionsFor}
							renderLink={renderLink}
						/>
					</li>
				))}
			</ul>

			{contents.length === 0 ? (
				<p className="p-6 text-center label">Nothing in here yet</p>
			) : null}
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
