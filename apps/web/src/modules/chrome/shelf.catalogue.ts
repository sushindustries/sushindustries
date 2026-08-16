import type { IconName, ShelfEntry } from "@sushindustries/ui";
import {
	REGISTRY_CATEGORIES,
	REGISTRY_ITEMS,
} from "@sushindustries/ui/registry";
import source from "../../../content/shelf.md?raw";
import { listPackages } from "../content/packages/packages.catalogue";
import { listPosts } from "../content/posts/posts.catalogue";

/*
 * The shelf, read from `content/shelf.md`.
 *
 * Same nested-list format as the nav, one level deeper, and the same reason for
 * it: what is on the shelf is content, and content on this site lives in
 * Markdown. The parser is the nav's with one extra depth, which is why the line
 * pattern below is identical.
 *
 * The three expansions are the difference. Writing out every component in
 * `shelf.md` would be a second copy of the registry, and the first thing that
 * goes wrong with a second copy is a folder that opens onto nothing.
 */

const LINE =
	/^(\s*)-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+`([^`]+)`)?(?:\s+-\s+(.+))?\s*$/;

/** Components, grouped into a folder per category. */
function componentFolders(): ShelfEntry[] {
	return REGISTRY_CATEGORIES.map((category) => {
		const items = REGISTRY_ITEMS.filter(
			(item) => item.category === category.id,
		);

		return {
			id: `category-${category.id}`,
			label: category.label,
			description: category.blurb,
			href: `/components?category=${category.id}`,
			icon: category.icon,
			meta: String(items.length),
			children: items.map((item) => ({
				id: item.name,
				label: item.title,
				description: item.description,
				href: `/components/${item.name}`,
				meta: item.subcategory,
			})),
		};
	}).filter((folder) => folder.children.length > 0);
}

function packageEntries(): ShelfEntry[] {
	return listPackages().map((entry) => ({
		id: `package-${entry.slug}`,
		label: entry.name,
		description: entry.description,
		href: `/packages/${entry.slug}`,
		icon: "package" as IconName,
	}));
}

function postEntries(): ShelfEntry[] {
	return listPosts().map((post) => ({
		id: `post-${post.slug}`,
		label: post.title,
		description: post.summary,
		href: `/posts/${post.slug}`,
		icon: "note" as IconName,
		meta: post.date,
	}));
}

/*
 * The machine-readable surfaces, as files in a Downloads folder.
 *
 * These are the only entries that are genuinely files rather than pages, so
 * they are the only ones that get the file glyph by name. Everything else on
 * the desktop is a place.
 */
function fileEntries(): ShelfEntry[] {
	return [
		{
			id: "file-llms",
			label: "llms.txt",
			description: "One line per page. What exists here, and nothing else",
			href: "/llms.txt",
			icon: "file",
			meta: "text",
		},
		{
			id: "file-llms-full",
			label: "llms-full.txt",
			description: "Every page inlined, so a reader makes one request",
			href: "/llms-full.txt",
			icon: "file",
			meta: "text",
		},
		{
			id: "file-registry",
			label: "registry.json",
			description: "Every component, in shadcn's registry format",
			href: "/r/registry.json",
			icon: "file",
			meta: "json",
		},
		{
			id: "file-sitemap",
			label: "sitemap.xml",
			description: "Every canonical URL",
			href: "/sitemap.xml",
			icon: "file",
			meta: "xml",
		},
		{
			id: "file-robots",
			label: "robots.txt",
			description: "Crawl rules, and the content signals above them",
			href: "/robots.txt",
			icon: "file",
			meta: "text",
		},
	];
}

const EXPANSIONS: Readonly<Record<string, () => ShelfEntry[]>> = {
	"{components}": componentFolders,
	"{packages}": packageEntries,
	"{posts}": postEntries,
	"{files}": fileEntries,
};

/*
 * Only the list under `## The shelf` is the shelf.
 *
 * The rest of the file documents the format, and that documentation contains a
 * fenced example of exactly the shape being parsed. Reading the whole file
 * would put `[Folder](/href)` on the home page.
 */
function shelfSection(): string {
	const at = source.indexOf("## The shelf");
	return at === -1 ? "" : source.slice(at);
}

export function shelfEntries(): readonly ShelfEntry[] {
	const roots: Array<ShelfEntry & { children: ShelfEntry[] }> = [];

	for (const line of shelfSection().split("\n")) {
		const expansion = EXPANSIONS[line.trim().replace(/^-\s+/, "")];
		if (expansion) {
			roots.at(-1)?.children.push(...expansion());
			continue;
		}

		const match = LINE.exec(line);
		if (!match) continue;

		const [, indent = "", label = "", href = "", icon, description] = match;

		const entry: ShelfEntry & { children: ShelfEntry[] } = {
			id: `${label}-${href}`,
			label,
			href,
			icon: icon as IconName | undefined,
			description,
			children: [],
		};

		if (indent.length === 0) {
			roots.push(entry);
			continue;
		}

		roots.at(-1)?.children.push(entry);
	}

	/*
	 * An empty `children` array would make a leaf look like a folder, since
	 * "is a folder" is "has children". Stripped here rather than guarded at
	 * every use.
	 */
	return roots.map((root) => ({
		...root,
		children: root.children.map((child) =>
			child.children && child.children.length === 0
				? { ...child, children: undefined }
				: child,
		),
	}));
}
