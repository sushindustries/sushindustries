import {
	Clock,
	Dock,
	FolderShelf,
	flatten,
	Icon,
	Laptop,
	matches,
	useDeskState,
} from "@sushindustries/ui";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { shelfEntries } from "./shelf.catalogue";
import { shelfActions } from "./shelf-actions";
import { renderShelfPage } from "./shelf-page";

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

export function SiteShelf(): ReactNode {
	const navigate = useNavigate();
	const [message, setMessage] = useState("");
	const [query, setQuery] = useState("");

	const entries = useMemo(() => shelfEntries(), []);
	const desk = useDeskState(DESK_KEY);

	/*
	 * The launcher searches everything, flattened, and opens folders in a
	 * window while leaving pages to the router. A launcher that navigated away
	 * for a folder would close the desktop to show you a directory listing of
	 * the desktop.
	 */
	const results = useMemo(() => {
		if (!query.trim()) return [];

		/*
		 * `flatten` is the shelf's own walk, exported. Every result carries the
		 * path that leads to it, which is what lets a folder be opened in a
		 * window rather than navigated to - and what lets the result say where
		 * it lives.
		 */
		return flatten(entries)
			.filter(({ entry }) => matches(entry, query))
			.slice(0, 12)
			.map(({ entry, path }) => {
				const isFolder = Boolean(entry.children?.length);

				return {
					id: [...path.map((step) => step.id), entry.id].join("/"),
					label: entry.label,
					description:
						path.length > 0
							? `${path.map((step) => step.label).join(" / ")} - ${entry.description ?? ""}`
							: entry.description,
					icon: (isFolder ? "folder" : "file") as "folder" | "file",
					onSelect() {
						/*
						 * A folder opens where it belongs. Navigating away to a
						 * directory listing of the desktop you are already looking at
						 * would be a strange answer to a search.
						 */
						if (isFolder || renderShelfPage(entry)) {
							desk.open([...path.map((step) => step.id), entry.id]);
						} else if (entry.href) {
							void navigate({ href: entry.href });
						}

						setQuery("");
					},
				};
			});
	}, [query, entries, desk, navigate]);

	const tasks = desk.desk.windows.map((entry) => ({
		id: entry.id,
		label: entry.path.at(-1) ?? "Window",
		icon: "folder" as const,
		active: entry.z === desk.desk.top,
	}));

	return (
		<>
			<Laptop
				title="sushindustries"
				wallpaper={<span className="desk-glow" />}
				dock={
					<Dock
						tasks={tasks}
						onSelectTask={desk.raise}
						onCloseTask={desk.close}
						results={results}
						query={query}
						onQuery={setQuery}
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
				<FolderShelf
					entries={entries}
					label="Everything on this site"
					rememberAs={DESK_KEY}
					renderEntry={renderShelfPage}
					actionsFor={(entry, path) =>
						shelfActions(entry, path, {
							navigate: (href) => void navigate({ href }),
							onResult: setMessage,
						})
					}
					renderLink={({ href, className, children }) => (
						<a href={href} className={className}>
							{children}
						</a>
					)}
				/>
			</Laptop>

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
