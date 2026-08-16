import { FolderShelf, Laptop } from "@sushindustries/ui";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { shelfEntries } from "./shelf.catalogue";
import { shelfActions } from "./shelf-actions";

/*
 * This site's shelf: the component, given this site's tree and this site's
 * actions.
 *
 * The same split as the nav. What is in the folders is `content/shelf.md`, how
 * a folder behaves is `FolderShelf` in `packages/ui`, and what the right-click
 * menu can do is `shelf-actions.ts`. What is left here is the one decision that
 * is genuinely about this page: that the menu should route through TanStack
 * Router rather than reload.
 */
export function SiteShelf(): ReactNode {
	const navigate = useNavigate();
	const [message, setMessage] = useState("");

	return (
		<>
			<Laptop title="sushindustries" wallpaper={<span className="desk-glow" />}>
				<FolderShelf
					entries={shelfEntries()}
					label="Everything on this site"
					searchable
					searchLabel="Search everything"
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
