import {
	Clock,
	Dock,
	FolderShelf,
	Icon,
	Laptop,
	useDeskState,
} from "@sushindustries/ui";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { shelfEntries } from "./shelf.catalogue";
import { shelfActions } from "./shelf-actions";

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
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return [];

		const flat: Array<{
			id: string;
			label: string;
			description?: string;
			icon?: "folder" | "file";
			path: string[];
			href?: string;
			isFolder: boolean;
		}> = [];

		function walk(list: typeof entries, path: string[]): void {
			for (const entry of list) {
				const isFolder = Boolean(entry.children?.length);

				flat.push({
					id: [...path, entry.id].join("/"),
					label: entry.label,
					description: entry.description,
					icon: isFolder ? "folder" : "file",
					path: [...path, entry.id],
					href: entry.href,
					isFolder,
				});

				if (entry.children) walk(entry.children, [...path, entry.id]);
			}
		}

		walk(entries, []);

		return flat
			.filter((item) =>
				`${item.label} ${item.description ?? ""}`
					.toLowerCase()
					.includes(trimmed),
			)
			.slice(0, 12)
			.map((item) => ({
				id: item.id,
				label: item.label,
				description: item.description,
				icon: item.icon,
				onSelect() {
					if (item.isFolder) desk.open(item.path);
					else if (item.href) void navigate({ href: item.href });
					setQuery("");
				},
			}));
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
