import { NavBar } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { SiteTheme } from "../theme/site-theme";
import type { Theme } from "../theme/theme.schemas";
import { navEntries } from "./nav.catalogue";

/*
 * This site's header: the NavBar component, given this site's nav.
 *
 * Everything shaped like a decision moved out. What is in the menu is
 * `content/nav.md`; what a panel looks like is `NavBar` in `packages/ui`; what
 * the glyphs are is `packages/ui/glyphs.md`. What is left here is the wordmark,
 * one external link, and the fact that this particular site has both.
 *
 * Plain anchors rather than <Link>: the nav renders on every page including
 * ones outside the router's typed route tree, and mixing the two kinds of
 * navigation in one list is how a nav ends up with links that work from some
 * pages and not others.
 */
export interface SiteNavProps {
	/** What the server rendered, handed down so the toggle starts in step. */
	readonly theme: Theme;
}

export function SiteNav({ theme }: SiteNavProps): ReactNode {
	return (
		<NavBar
			brand={<span className="mono text-sm font-semibold">sushindustries</span>}
			entries={navEntries()}
			trailing={
				<span className="flex items-center gap-3">
					<a
						href="https://github.com/sushindustries"
						className="nav-link"
						target="_blank"
						rel="noreferrer"
					>
						GitHub
					</a>

					<SiteTheme initial={theme} />
				</span>
			}
		/>
	);
}
