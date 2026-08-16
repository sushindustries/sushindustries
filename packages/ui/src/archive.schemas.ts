import * as z from "zod";

/*
 * The shape of anything an Archive can list.
 *
 * A schema rather than a bare type because the items come from a registry file
 * that a person edits by hand, and the failure it prevents is specific: a
 * missing `category` silently drops an item out of every filter, so it renders
 * nowhere and nothing complains. Parsing turns that into a message.
 *
 * It is deliberately about *presentation*, not about packaging. The registry
 * knows about files and dependency versions; the archive knows about a title,
 * a group and a picture. Mapping one to the other is a few lines, and keeping
 * them separate is what lets this component list things that are not packages.
 */

export const archiveCategorySchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
});

export type ArchiveCategory = z.infer<typeof archiveCategorySchema>;

export const archiveItemSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string(),
	/** Must match an `ArchiveCategory.id`, or the item is unreachable by filter. */
	category: z.string().min(1),
	/**
	 * A finer grouping inside a category. Free text on purpose: subcategories
	 * are for reading, not filtering, so an unrecognised one costs nothing.
	 */
	subcategory: z.string().optional(),
	/**
	 * Cross-cutting labels. These *are* filterable, so the chip row is built
	 * from whatever appears here - a tag used once gets a chip used once,
	 * which is the signal that it should not have been a tag.
	 */
	tags: z.array(z.string().min(1)).default([]),
	/** Where the card links to. */
	href: z.string().min(1),
	/**
	 * A live preview URL. Optional because not everything is visual - a
	 * frontmatter parser has nothing to show, and a card that insists on a
	 * picture would invent a meaningless one.
	 */
	previewSrc: z.string().optional(),
	/** What the preview is doing, for readers who cannot see it. */
	preview: z.string().optional(),
	/** Shown top-right. A version, a package name. */
	meta: z.string().optional(),
});

export type ArchiveItem = z.infer<typeof archiveItemSchema>;

export const archiveSchema = z.object({
	categories: z.array(archiveCategorySchema),
	items: z.array(archiveItemSchema),
});

export type Archive = z.infer<typeof archiveSchema>;

/**
 * Parses and additionally checks that every item's category exists.
 *
 * Zod cannot express that cross-reference, and it is the one that actually
 * breaks the page: an item pointing at a category nobody declared disappears
 * from the grid without an error anywhere.
 */
export function parseArchive(input: unknown): Archive {
	const archive = archiveSchema.parse(input);
	const known = new Set(archive.categories.map((category) => category.id));

	for (const item of archive.items) {
		if (!known.has(item.category)) {
			throw new Error(
				`Archive item "${item.id}" has category "${item.category}", which is not declared.`,
			);
		}
	}

	return archive;
}
