import type { IconName, ShelfEntry } from "@sushindustries/ui";

/*
 * Desks, read from `content/desks/*.md`.
 *
 * A desk is what is on a drawn machine: its icons, its folders and the apps
 * they open. It is Markdown for the same reason the nav, the shelf and the
 * footer are - that list is content, and content on this site lives in files
 * somebody can edit without opening a component.
 *
 * The idea this adds is that **the extension decides the kind**. `x.app` is an
 * app, `x.folder` is a folder, and a plain link is a link. A Markdown author
 * gets to say what a thing *is* rather than passing a `kind` attribute, and the
 * line reads like the filename it is standing in for.
 *
 * Globbed, so a new desk is a new file. There is no registry of desks, which is
 * the same bargain as `packages/*`: an index is a thing that drifts.
 */

export interface Desk {
	readonly slug: string;
	readonly title: string;
	readonly entries: readonly ShelfEntry[];
}

const FILES = import.meta.glob<string>("../../../../content/desks/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

/*
 * One line: indentation, then either `name.ext` or `[Label](href)`, then an
 * optional glyph in backticks and an optional ` - description`.
 *
 * The same shape as the nav and footer parsers on purpose. An author who has
 * written one of those files can write this one without reading anything.
 */
const LINE =
	/^(\s*)-\s+(?:\[([^\]]+)\]\(([^)]+)\)|([\w-]+)\.(app|folder))(?:\s+`([^`]+)`)?(?:\s+-\s+(.+))?\s*$/;

/** Everything under `## The desk`, which is where the list lives. */
function deskSection(source: string): string {
	const at = source.indexOf("## The desk");
	return at === -1 ? "" : source.slice(at);
}

function titleOf(source: string): string {
	return /^title:\s*(.+)$/m.exec(source)?.[1]?.trim() ?? "Desk";
}

/*
 * Lines to entries, nesting by indentation.
 *
 * Two levels only, which is what a desktop is: icons, and what is inside one
 * folder. A third level would be a file tree, and a file tree in a window that
 * opens windows is a worse version of the window.
 */
function parse(source: string): ShelfEntry[] {
	const roots: ShelfEntry[] = [];
	const children = new Map<string, ShelfEntry[]>();
	let current: string | undefined;

	for (const line of deskSection(source).split("\n")) {
		const match = LINE.exec(line);
		if (!match) continue;

		const [, indent = "", linkLabel, href, name, kind, icon, description] =
			match;

		/*
		 * An app or a folder is named by its filename, so the label is the stem
		 * with its first letter raised. `assistant.app` is "Assistant", and
		 * nobody has to write the word twice.
		 */
		const label =
			linkLabel ?? (name ? name[0]?.toUpperCase() + name.slice(1) : "");
		if (!label) continue;

		const id = name ? `${name}.${kind}` : (href ?? label);

		const entry: ShelfEntry = {
			id,
			label,
			description,
			/*
			 * An app has no href: opening it is the point, and a link would take
			 * the reader off the desk to a route that does not exist.
			 */
			href: kind === "app" ? undefined : href,
			icon: (icon as IconName | undefined) ?? undefined,
			/* Filled below for folders, so an empty one can be dropped. */
			children: kind === "folder" ? [] : undefined,
		};

		if (indent.length === 0) {
			roots.push(entry);
			current = kind === "folder" ? id : undefined;
			if (kind === "folder") children.set(id, []);
			continue;
		}

		if (current) children.get(current)?.push(entry);
	}

	/*
	 * Folders get their contents, and an empty folder is dropped rather than
	 * drawn. An icon that opens onto nothing is worse than a missing icon: the
	 * reader assumes the page is broken rather than that the folder is bare.
	 */
	return roots
		.map((entry) =>
			entry.children
				? { ...entry, children: children.get(entry.id) ?? [] }
				: entry,
		)
		.filter((entry) => !entry.children || entry.children.length > 0);
}

const DESKS: readonly Desk[] = Object.entries(FILES).map(([path, raw]) => ({
	slug: path.split("/").at(-1)?.replace(/\.md$/, "") ?? "desk",
	title: titleOf(raw),
	entries: parse(raw),
}));

export function listDesks(): readonly Desk[] {
	return DESKS;
}

export function findDesk(slug: string): Desk | undefined {
	return DESKS.find((desk) => desk.slug === slug);
}
