import { NavBar } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { SITE } from "../content/site.catalogue";
import { SiteTheme } from "../theme/site-theme";
import type { Theme } from "../theme/theme.schemas";
import { GithubStar } from "./github-star";
import { navEntries } from "./nav.catalogue";
import { SiteSearch, SiteSearchTrigger } from "./site-search";

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
			brand={
				<span className="flex items-center gap-2">
					<img
						src="/sushi-logo.png"
						alt=""
						width={26}
						height={26}
						className="nav-mark"
					/>
					<span className="mono text-sm font-semibold">{SITE.name}</span>
				</span>
			}
			entries={navEntries()}
			trailing={
				<span className="flex items-center gap-3">
					{/*
					 * Three things, deliberately: search, the repo, the theme.
					 * LinkedIn lives on the shelf - a header that lists every
					 * place I exist is a business card, not a nav.
					 */}
					<SiteSearchTrigger />
					<SiteSearch />
					<GithubStar />
					<SiteTheme initial={theme} />
				</span>
			}
		/>
	);
}
