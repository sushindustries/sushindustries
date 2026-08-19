import {
	BootLoader,
	Clock,
	DEVICES,
	Device,
	Dock,
	FolderShelf,
	Icon,
	SEARCH_PATH,
	type ShelfEntry,
	useDeskState,
	useDeviceKind,
} from "@sushindustries/ui";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { shelfEntries } from "./shelf.catalogue";
import { shelfActions } from "./shelf-actions";
import { isDeskOnly, renderShelfPage } from "./shelf-page";
import { SiteMark } from "./site-mark";

/*
 * This site's desktop: the components, given this site's tree and actions.
 *
 * The same split as the nav. What is in the folders is `content/shelf.md`, how
 * a folder behaves is `FolderShelf`, how a window behaves is `DeskWindow`, and
 * what the right-click menu can do is `shelf-actions.ts`. What is left here is
 * the decisions that are genuinely about this page: that the menu routes
 * through TanStack Router rather than reloading, and that the dock searches
 * this site's own tree.
 *
 * The desk state is held here rather than inside the shelf because two things
 * need it - the shelf draws the windows, the dock lists them - and the place
 * where two components meet is the component above both of them.
 */
const DESK_KEY = "sushindustries.desk";

/*
 * How many icons wide the desktop is, from the same table the stylesheet
 * compiles its media queries from.
 *
 * The shelf needs this as a number rather than as CSS, because snapping a
 * dropped icon to a cell is arithmetic and because two icons colliding has to
 * be resolved before either is drawn.
 *
 * The narrowest machine is the fallback, deliberately: `useDeviceKind` is null
 * until mounted, so this answers for the server render and the first client
 * frame. Three columns fits everywhere. Guessing the laptop's seven would mean
 * one paint with icons packed into a grid too narrow for them, on every phone
 * that ever loads this page.
 */
function deviceColumns(kind: ReturnType<typeof useDeviceKind>): number {
	const found = DEVICES.find((device) => device.kind === kind);
	return found ? found.columns : DEVICES[0].columns;
}

export function SiteShelf(): ReactNode {
	const navigate = useNavigate();
	const [message, setMessage] = useState("");
	const [query, setQuery] = useState("");
	const [booted, setBooted] = useState(false);

	/*
	 * The tree, with one icon replaced by a live one.
	 *
	 * Done here rather than in `shelf.md` because Markdown can name a glyph and
	 * cannot hold a React component - which is exactly where that line should
	 * be drawn. The file says *which* entry is special; this says what it is
	 * made of.
	 */
	const entries = useMemo(
		() =>
			shelfEntries().map((entry) =>
				entry.icon === "sushi"
					? {
							...entry,
							/*
							 * `SiteMark` is the whole of it: the model, a glyph under it,
							 * and the four props that make a hero viewer behave at 48px.
							 * All of that is `ModelMark` in the viewer package, so the only
							 * thing decided here is that this entry gets one.
							 */
							art: <SiteMark seconds={18} />,
						}
					: entry,
			),
		[],
	);

	const desk = useDeskState(DESK_KEY);
	const columns = deviceColumns(useDeviceKind());

	/*
	 * What opening a thing means, in one function.
	 *
	 * Clicking an icon, choosing a search result and picking Open from the
	 * right-click menu are three ways to ask for the same thing, and they were
	 * three implementations of it. The menu's went to the router unconditionally
	 * and produced a 404 for `/assistant`, which is a desktop id rather than a
	 * route - an icon that opens perfectly well by clicking it had a menu item
	 * that broke it.
	 */
	const open = useCallback(
		(entry: ShelfEntry, path: readonly ShelfEntry[] = []) => {
			const isFolder = Boolean(entry.children?.length);

			if (isFolder || renderShelfPage(entry)) {
				desk.open([...path.map((step) => step.id), entry.id]);
			} else if (entry.href) {
				void navigate({ href: entry.href });
			}
		},
		[desk, navigate],
	);

	/*
	 * The launcher searches everything, flattened, and opens folders in a
	 * window while leaving pages to the router. A launcher that navigated away
	 * for a folder would close the desktop to show you a directory listing of
	 * the desktop.
	 */
	const tasks = desk.desk.windows.map((entry) => {
		const search = entry.path[0] === SEARCH_PATH[0];

		return {
			id: entry.id,
			label: search ? "Search" : (entry.path.at(-1) ?? "Window"),
			icon: (search ? "search" : "folder") as "search" | "folder",
			active: entry.z === desk.desk.top && !entry.minimised,
			minimised: entry.minimised,
		};
	});

	return (
		<>
			<Device
				title="sushindustries"
				wallpaper={<span className="desk-glow" />}
				dock={
					<Dock
						tasks={tasks}
						onSelectTask={desk.toggle}
						onCloseTask={desk.close}
						onSearch={() => desk.open(SEARCH_PATH)}
						trailing={
							/*
							 * The corner: a way out, a way to reach me, and the time.
							 *
							 * The clock is the reader's own, from `Intl` with no locale
							 * and no zone passed - so it is local without anybody being
							 * asked where they are and without a byte going anywhere.
							 */
							<span className="flex items-center gap-2">
								{desk.desk.windows.length > 0 || desk.desk.hidden.length > 0 ? (
									<button
										type="button"
										className="dock-task-face"
										onClick={desk.reset}
									>
										Reset
									</button>
								) : null}

								<a
									className="dock-icon"
									href="https://www.linkedin.com/in/adamjurek22"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="Adam Jurek on LinkedIn"
									title="LinkedIn"
								>
									<Icon name="linkedin" size={16} />
								</a>

								<Clock />
							</span>
						}
					/>
				}
			>
				{/*
				 * The machine boots once, over the desktop rather than over the page.
				 *
				 * `ready` is `desk.ready`, which flips when the stored arrangement has
				 * been read - and that is the honest thing to wait for. Windows
				 * restored from storage cannot be server-rendered, so they arrive a
				 * frame after everything else and visibly pop in. Covering that is
				 * covering something real; a loader over a decoration would be
				 * theatre.
				 */}
				{booted ? null : (
					<BootLoader
						ready={desk.ready}
						label="Starting up"
						onDone={() => setBooted(true)}
					>
						<SiteMark seconds={6} size={64} />
					</BootLoader>
				)}

				<FolderShelf
					entries={entries}
					label="Everything on this site"
					desk={desk}
					columns={columns}
					renderEntry={renderShelfPage}
					query={query}
					onQuery={setQuery}
					onChoose={(entry, path) => {
						/*
						 * A folder, or anything whose page this site can render, opens
						 * on the desk. Everything else follows its link. Navigating
						 * away to a directory listing of the desktop you are already
						 * looking at would be a strange answer to a search.
						 */
						open(entry, path);
						setQuery("");
					}}
					actionsFor={(entry, path) =>
						shelfActions(entry, path, {
							navigate: (href) => void navigate({ href }),
							/*
							 * The same `open`, so the menu and the click cannot drift.
							 * That drift is what put a 404 behind a working icon.
							 */
							onOpen: open,
							/*
							 * Copy link and Share are withheld for entries whose href is
							 * a desktop id. Offering somebody a link that 404s for them
							 * is worse than not offering one.
							 */
							linkable: (candidate) => !isDeskOnly(candidate),
							onResult: setMessage,
						})
					}
					renderLink={({ href, className, children }) => (
						<a href={href} className={className}>
							{children}
						</a>
					)}
				/>
			</Device>

			{/*
			 * What just happened, announced rather than shown.
			 *
			 * `role="status"` is polite: it waits for a screen reader to finish
			 * what it was saying. A copied link is not urgent enough to interrupt
			 * anybody, and it is also the only feedback a clipboard write gives -
			 * nothing on screen changes when it succeeds.
			 */}
			<p className="shelf-status label mt-4" role="status">
				{message}
			</p>
		</>
	);
}
