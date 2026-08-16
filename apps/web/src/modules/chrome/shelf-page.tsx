import { MarkdownView, type ShelfEntry } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { findComponentPage } from "../content/components/component-page";
import { findPackage } from "../content/packages/packages.catalogue";
import { findPost } from "../content/posts/posts.catalogue";
import { BLOCKS } from "../markdown/blocks";
import { findDemo } from "../showcase/demos";

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

export function renderShelfPage(entry: ShelfEntry): ReactNode {
	const href = entry.href;
	if (!href) return null;

	const component = slugFrom(href, "/components/");
	if (component) {
		const page = findComponentPage(component, (id) => Boolean(findDemo(id)));
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

		return <MarkdownView source={found.readme} blocks={BLOCKS} />;
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
