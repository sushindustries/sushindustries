import type { IconName } from "@sushindustries/ui";
import {
	REGISTRY_CATEGORIES,
	type RegistryItem,
} from "@sushindustries/ui/registry";
import { listRegistry } from "../../registry/registry.catalogue";
import { listBuiltPages } from "../pages/pages.catalogue";
import { findPost, listPosts } from "../posts/posts.catalogue";
import { listComponentDocs } from "./components.catalogue";

/*
 * The reference graph around one component, in both directions.
 *
 * Everything here is derived from data the bundle already carries - the
 * registry's `registryDependencies` and the Markdown bodies of pages, posts
 * and hand-written docs - so the lists cannot say something the site does
 * not. A component page that ends with "used by these, mentioned here" is a
 * page you can iterate from: change the element, and the bottom of its own
 * document tells you where to look.
 *
 * Each entry carries its pastel: the component chips wear their category's
 * tone and glyph, pages and posts wear theirs, so the row is recognisable
 * the way the search results are - by colour and shape before by name.
 */

export interface BacklinkRef {
	/** Registry name, which is also the key into the reference map. */
	readonly name: string;
	/** Category id - the `data-tone` vocabulary. */
	readonly tone: string;
	readonly icon: IconName;
}

export interface MentionSource {
	readonly title: string;
	readonly href: string;
	readonly tone: string;
	readonly icon: IconName;
}

export interface ComponentBacklinks {
	/** Elements this item installs alongside itself. */
	readonly uses: readonly BacklinkRef[];
	/** Elements that install this item alongside themselves. */
	readonly usedBy: readonly BacklinkRef[];
	/** Documents whose prose mentions this element. */
	readonly mentionedIn: readonly MentionSource[];
}

const CATEGORY_ICON = new Map<string, IconName>(
	REGISTRY_CATEGORIES.map((category) => [category.id, category.icon]),
);

function toRef(item: RegistryItem): BacklinkRef {
	return {
		name: item.name,
		tone: item.category,
		icon: CATEGORY_ICON.get(item.category) ?? "layers",
	};
}

/** True when `body` names the element the way prose here names things. */
function mentions(body: string, item: RegistryItem): boolean {
	return (
		body.includes(`\`${item.name}\``) || body.includes(`\`${item.title}\``)
	);
}

export function componentBacklinks(name: string): ComponentBacklinks {
	const items = listRegistry();
	const byName = new Map(items.map((entry) => [entry.name, entry]));
	const item = byName.get(name);
	if (!item) return { uses: [], usedBy: [], mentionedIn: [] };

	const uses = (item.registryDependencies ?? [])
		.map((dep) => byName.get(dep))
		.filter((dep): dep is RegistryItem => dep !== undefined)
		.map(toRef);

	const usedBy = items
		.filter((entry) => entry.registryDependencies?.includes(name))
		.map(toRef);

	const mentionedIn: MentionSource[] = [];

	for (const doc of listComponentDocs()) {
		if (doc.slug === name) continue;
		if (doc.sections.some((section) => mentions(section.body, item))) {
			const owner = byName.get(doc.slug);
			mentionedIn.push({
				title: doc.title,
				href: `/components/${doc.slug}`,
				tone: owner?.category ?? "docs",
				icon: owner ? (CATEGORY_ICON.get(owner.category) ?? "layers") : "book",
			});
		}
	}

	for (const page of listBuiltPages()) {
		if (mentions(page.body, item)) {
			mentionedIn.push({
				title: page.title,
				href: `/p/${page.slug}`,
				tone: "docs",
				icon: "book",
			});
		}
	}

	for (const summary of listPosts()) {
		const post = findPost(summary.slug);
		if (post && mentions(post.body, item)) {
			mentionedIn.push({
				title: post.title,
				href: `/posts/${summary.slug}`,
				tone: "content",
				icon: "note",
			});
		}
	}

	return { uses, usedBy, mentionedIn };
}
