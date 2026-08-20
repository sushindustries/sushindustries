import { MarkdownView, type ShelfEntry } from "@sushindustries/ui";
import { findDemoSource, hasDemo } from "@sushindustries/ui/demo-sources";
import type { ReactNode } from "react";
import { SiteAssistant } from "../assistant/site-assistant";
import { findComponentPage } from "../content/components/component-page";
import { findPackage } from "../content/packages/packages.catalogue";
import { findPost } from "../content/posts/posts.catalogue";
import { BLOCKS } from "../markdown/blocks";

/*
 * A page, rendered inside a window on the desktop.
 *
 * The site's content is already Markdown in a catalogue, so showing a page in a
 * window is a lookup and a `MarkdownView` - not a second copy of anything, and
 * not an iframe of the route. An iframe would be simpler and would mount the
 * whole site inside itself, nav and footer included, which is a page in a
 * picture frame rather than a page on a desktop.
 *
 * Anything this cannot render returns null, and the entry stays an ordinary
 * link. That is the important half: a folder of things where some open here
 * and some navigate away is worse than either, so the rule is that if the
 * content is on hand it opens here, and if it is not the link does what links
 * do.
 */

/** `/components/reveal` -> `reveal`. */
function slugFrom(href: string, prefix: string): string | null {
	if (!href.startsWith(prefix)) return null;

	const rest = href.slice(prefix.length).split("?")[0] ?? "";
	return rest.length > 0 ? rest : null;
}

/**
 * Entries that exist on the desktop and nowhere else.
 *
 * `/assistant` is an id for a window, not a route - nothing serves it, and
 * nothing should: a chat panel on a page you navigate to is a page with a chat
 * panel on it, and this one is an application running on a machine.
 *
 * It has to be written down because three things ask the same question and
 * would otherwise each answer it differently: the right-click Open, which
 * navigated and produced a 404; Copy link and Share, which would have handed
 * somebody a URL that 404s for them too; and the desktop itself.
 */
const DESK_ONLY: readonly string[] = ["/assistant"];

export function isDeskOnly(entry: ShelfEntry): boolean {
	return Boolean(entry.href && DESK_ONLY.includes(entry.href));
}

export function renderShelfPage(entry: ShelfEntry): ReactNode {
	const href = entry.href;
	if (!href) return null;

	/*
	 * The assistant is an application, not a page.
	 *
	 * It is the one entry here whose window is a live component rather than a
	 * lookup, and the only one with no route behind it: `/assistant` is an id
	 * for the desktop and nothing serves it. A chat panel on a page you navigate
	 * to is a page with a chat panel on it; this one is a thing running on a
	 * machine, which is the whole reason it is here.
	 */
	if (href === DESK_ONLY[0]) return <SiteAssistant />;

	const component = slugFrom(href, "/components/");
	if (component) {
		const page = findComponentPage(
			component,
			hasDemo,
			(id) => findDemoSource(id)?.source,
		);
		if (!page) return null;

		/*
		 * The first section only. A component's page is tabbed - Home, API,
		 * Examples - and a window is not the place to reproduce a tab bar that
		 * already exists two clicks away on the page itself.
		 */
		const first = page.sections[0];
		if (!first) return null;

		return (
			<>
				<MarkdownView source={first.body} blocks={BLOCKS} />
				<p className="mt-5">
					<a className="label" href={href}>
						Open the full page
					</a>
				</p>
			</>
		);
	}

	const pkg = slugFrom(href, "/packages/");
	if (pkg) {
		const found = findPackage(pkg);
		if (!found) return null;

		// `body`, not `readme`: the window's title bar already names the package,
		// and a second h1 inside the page hosting the desk breaks its outline.
		return <MarkdownView source={found.body} blocks={BLOCKS} />;
	}

	const post = slugFrom(href, "/posts/");
	if (post) {
		const found = findPost(post);
		if (!found) return null;

		return <MarkdownView source={found.body} blocks={BLOCKS} />;
	}

	/*
	 * The machine-readable files are deliberately not rendered here. They are
	 * the thing a crawler fetches, and the honest way to look at one is to
	 * fetch it - so those entries stay links and open the actual file.
	 */
	return null;
}
