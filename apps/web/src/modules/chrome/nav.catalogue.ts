import type { IconName, NavEntry, NavItem } from "@sushindustries/ui";
import {
	REGISTRY_CATEGORIES,
	REGISTRY_ITEMS,
} from "@sushindustries/ui/registry";
import source from "../../../content/nav.md?raw";

/*
 * The header, read from `content/nav.md`.
 *
 * Same approach as every other catalogue here: the content is Markdown, the
 * glob is resolved at build time, and the component that renders it knows
 * nothing about this site. What is different is that a nav is a tree, so the
 * format is a nested list rather than a frontmatter block.
 *
 *   - [Label](/href) `icon` - description
 *     - [Child](/href) `icon` - description
 *
 * Indentation is the nesting, which is what a Markdown list already means. The
 * parser is about thirty lines because the format was chosen to keep it there:
 * one line is one item, and there is no case where a line's meaning depends on
 * a line that is not its parent.
 *
 * `{categories}` expands from the registry rather than being written out. A
 * second list of categories in a second file is a second list to keep in step,
 * and the first thing that goes wrong is a category in the menu that filters
 * to nothing.
 */

const LINE =
	/^(\s*)-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+`([^`]+)`)?(?:\s+-\s+(.+))?\s*$/;

/** How many components are in a category. Shown as the badge. */
function countIn(category: string): number {
	return REGISTRY_ITEMS.filter((item) => item.category === category).length;
}

/*
 * Categories with something in them.
 *
 * An empty one is not a bug in the data: `3d` is a real category whose
 * component ships from `packages/react-product-viewer` rather than from the
 * registry, so it can be empty and correct. What it must not be is in the menu,
 * because a menu entry that filters to nothing is indistinguishable from a
 * broken filter.
 */
function categoryItems(): NavItem[] {
	return REGISTRY_CATEGORIES.filter((category) => countIn(category.id) > 0).map(
		(category) => ({
			label: category.label,
			href: `/components?category=${category.id}`,
			icon: category.icon,
			// The category *is* the tone. One word, resolved by the stylesheet.
			tone: category.id,
			description: category.blurb,
			badge: String(countIn(category.id)),
		}),
	);
}

/*
 * Only the list under `## The nav` is the nav.
 *
 * The rest of the file documents the format, and the format documentation
 * contains a fenced example that is a list of exactly the shape being parsed.
 * Reading the whole file would put `[Label](/href)` in the header.
 */
function navSection(): string {
	const at = source.indexOf("## The nav");
	return at === -1 ? "" : source.slice(at);
}

export function navEntries(): readonly NavEntry[] {
	const entries: Array<NavEntry & { items: NavItem[] }> = [];

	for (const line of navSection().split("\n")) {
		if (line.trim() === "- {categories}") {
			entries.at(-1)?.items.push(...categoryItems());
			continue;
		}

		const match = LINE.exec(line);
		if (!match) continue;

		/*
		 * The label and href groups are not optional in the pattern, so a match
		 * guarantees both. `noUncheckedIndexedAccess` cannot know that, and
		 * asserting it here is cheaper than a schema for four fields.
		 */
		const [, indent = "", label = "", href = "", icon, description] = match;

		const item: NavItem = {
			label,
			href,
			icon: icon as IconName | undefined,
			description,
		};

		if (indent.length === 0) {
			entries.push({ ...item, items: [] });
			continue;
		}

		entries.at(-1)?.items.push(item);
	}

	return entries;
}

/**
 * Every glyph the nav asks for, so the doctor's check has something to compare
 * against without parsing TSX.
 */
export function navIcons(): readonly string[] {
	return navEntries().flatMap((entry) => [
		...(entry.icon ? [entry.icon] : []),
		...(entry.items ?? []).flatMap((item) => (item.icon ? [item.icon] : [])),
	]);
}
