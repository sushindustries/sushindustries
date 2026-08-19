import type { MenuAction, ShelfEntry } from "@sushindustries/ui";

/*
 * What the right-click menu can do to a thing on the shelf.
 *
 * These live in the app, not in `FolderShelf`, because they are about this
 * site's content. A shelf that knew what "save as Markdown" meant could only
 * ever list one kind of thing; this way the component knows how to summon a
 * menu and nothing about what is in it.
 *
 * Every action degrades. The share sheet is not on desktop Firefox, the
 * clipboard is not available on a page served over plain HTTP, and neither is
 * a reason to hide a menu item - so each one falls back rather than failing,
 * and the fallback is the thing the reader would have done by hand.
 */

/** An absolute URL, since a share sheet and a clipboard both need one. */
function absolute(href: string): string {
	if (typeof window === "undefined") return href;
	return new URL(href, window.location.origin).toString();
}

/*
 * Hands the browser a file it never fetched.
 *
 * A Blob URL rather than a data: URL: data: URLs are capped at a few megabytes
 * in some browsers and are awkward to revoke, and this one is revoked on the
 * next frame so the string does not sit in memory for the life of the tab.
 */
function download(filename: string, contents: string, type: string): void {
	const url = URL.createObjectURL(new Blob([contents], { type }));
	const anchor = document.createElement("a");

	anchor.href = url;
	anchor.download = filename;
	anchor.click();

	requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** Markdown for one entry: frontmatter, a line about it, and where it lives. */
function toMarkdown(entry: ShelfEntry, path: readonly ShelfEntry[]): string {
	const where = [...path, entry].map((step) => step.label).join(" / ");

	return [
		"---",
		`title: ${entry.label}`,
		entry.description ? `summary: ${entry.description}` : null,
		`source: ${absolute(entry.href ?? "/")}`,
		"---",
		"",
		`# ${entry.label}`,
		"",
		entry.description ?? "",
		"",
		`Found under **${where}** on sushindustries.`,
		"",
		`<${absolute(entry.href ?? "/")}>`,
		"",
	]
		.filter((line) => line !== null)
		.join("\n");
}

async function copy(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export interface ShelfActionOptions {
	/** Navigates, so an "Open" that respects the router is possible. */
	navigate?: (href: string) => void;
	/**
	 * Opens the entry wherever it belongs, instead of navigating to its href.
	 *
	 * Supplied, this *is* Open. The menu has no business deciding whether a
	 * thing becomes a window on a desktop or a page in the address bar - that is
	 * the same decision the host already makes when somebody double-clicks, and
	 * having it in two places is how the two came apart: Open navigated to
	 * `/assistant`, which is an id for a window and not a route, and produced a
	 * 404 for an icon that opens perfectly well by clicking it.
	 */
	onOpen?: (entry: ShelfEntry, path: readonly ShelfEntry[]) => void;
	/**
	 * Whether this entry's href is a URL somebody else could open.
	 *
	 * Defaults to "it has one". A desktop can have entries whose href is an
	 * internal id, and Copy link and Share are actively harmful for those -
	 * they hand somebody a link that 404s, which is worse than not offering it.
	 */
	linkable?: (entry: ShelfEntry) => boolean;
	/** Told what happened, so the page can say so. */
	onResult?: (message: string) => void;
}

export function shelfActions(
	entry: ShelfEntry,
	path: readonly ShelfEntry[],
	{ navigate, onOpen, linkable, onResult }: ShelfActionOptions = {},
): MenuAction[] {
	const href = entry.href;
	const isFolder = Boolean(entry.children?.length);
	const canLink = linkable ? linkable(entry) : Boolean(href);

	const actions: MenuAction[] = [];

	if (onOpen || href) {
		actions.push({
			id: "open",
			label: isFolder ? "Open" : "Open",
			icon: isFolder ? "folder-open" : "file",
			onSelect() {
				if (onOpen) onOpen(entry, path);
				else if (href && navigate) navigate(href);
				else if (href) window.location.assign(href);
			},
		});
	}

	actions.push({
		id: "markdown",
		label: "Save as Markdown",
		icon: "download",
		hint: ".md",
		onSelect() {
			download(
				`${entry.id.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.md`,
				toMarkdown(entry, path),
				"text/markdown;charset=utf-8",
			);
			onResult?.(`Saved ${entry.label} as Markdown`);
		},
	});

	if (href && canLink) {
		actions.push({
			id: "copy",
			label: "Copy link",
			icon: "link",
			async onSelect() {
				const ok = await copy(absolute(href));
				onResult?.(ok ? "Link copied" : "Could not reach the clipboard");
			},
		});

		actions.push({
			id: "share",
			label: "Share with a friend",
			icon: "share",
			async onSelect() {
				/*
				 * The share sheet exists on phones and on Safari, and not much
				 * else. Where it does not, copying the link is what the reader
				 * would have done next anyway, so that is the fallback rather than
				 * a disabled item explaining what their browser cannot do.
				 */
				if (navigator.share) {
					try {
						await navigator.share({
							title: entry.label,
							text: entry.description,
							url: absolute(href),
						});
						return;
					} catch {
						// A cancelled share sheet throws. That is not a failure, and
						// it must not fall through to copying something they chose
						// not to send.
						return;
					}
				}

				const ok = await copy(absolute(href));
				onResult?.(
					ok ? "Link copied, ready to send" : "Could not reach the clipboard",
				);
			},
		});
	}

	return actions;
}
