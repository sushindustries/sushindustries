import type { ShelfEntry } from "@sushindustries/ui";
import * as z from "zod";

/*
 * What a desktop icon is allowed to say.
 *
 * An icon on a desk is a tile roughly six to nine characters wide, and its
 * label is the one part an author writes freely. Everything else about the
 * shelf is derived - the glyph comes from a table, the href from a route, the
 * kind from a file extension - so the label is the only field that can be
 * wrong in a way nothing catches.
 *
 * It was wrong. `packageEntries` labelled every icon with the full scoped
 * package name, and `@sushindustries/react-product-viewer` is thirty-six
 * characters with no space in it. In a 108px tile it laid out 148px wide and
 * overlapped its neighbours by up to 26 pixels. The stylesheet now refuses to
 * let a label out of its tile whatever it says, but a label that has to be
 * broken across four lines to fit is still a label nobody reads.
 *
 * So this is the other half, at the data layer. It is the definition of the
 * rule, not the gate: these constants are read back out of this file by
 * `checkDeskLabelsFit` in `scripts/doctor.mjs`, which is what actually fails a
 * push. The schema still runs when a desk is first rendered, so a label that
 * got past the doctor cannot quietly draw wrong - but the doctor is where an
 * author finds out, seconds after typing it, with the file and line named.
 *
 * Stating the numbers once and parsing them from here is the same arrangement
 * the doctor already uses for `SECTION_ORDER`. Two copies of a limit is a
 * limit that will disagree with itself.
 *
 * Nothing here truncates. Shortening a name is a decision with a right answer
 * that only the author knows, and a schema that quietly cut the string would
 * hide the mistake instead of reporting it - which is how `@sushindustries/re`
 * would end up shipped as a package name somebody tries to install.
 */

/**
 * Roughly two lines in the narrowest tile the grid will hand out.
 *
 * `.shelf` floors a column at `clamp(6rem, 22cqi, 9.5rem)` and the label is
 * `clamp(--t-xs, 3.2cqi, --t-sm)`, so 6rem holds about twelve characters a
 * line. Twenty-four is two comfortable lines; past that a tile is taller than
 * the icon it belongs to and the row it sits in stops being scannable.
 */
export const MAX_LABEL = 24;

/**
 * One line of the caption under a label, at the same width.
 *
 * Longer is not a layout failure - the tile grows - but it is the difference
 * between a desk of icons and a desk of paragraphs.
 */
export const MAX_DESCRIPTION = 80;

export const shelfEntrySchema: z.ZodType<ShelfEntry> = z.lazy(() =>
	z.object({
		id: z.string().min(1),
		label: z
			.string()
			.min(1, "an icon with no label is an icon nobody can name")
			.max(
				MAX_LABEL,
				`a desktop icon label is at most ${MAX_LABEL} characters - use the short name and let the page carry the full one`,
			),
		description: z.string().max(MAX_DESCRIPTION).optional(),
		href: z.string().optional(),
		icon: z.string().optional(),
		meta: z.string().optional(),
		children: z.array(shelfEntrySchema).optional(),
	}),
) as z.ZodType<ShelfEntry>;

/**
 * Every entry, checked, with the source named when one is wrong.
 *
 * Throws rather than filtering. A dropped icon is a hole in a desk that nobody
 * notices until they go looking for the thing that used to be there, and this
 * runs at build time where a throw is a red build and a message - the cheapest
 * possible place to find out.
 */
export function validateShelf(
	entries: readonly ShelfEntry[],
	source: string,
): readonly ShelfEntry[] {
	const result = z.array(shelfEntrySchema).safeParse(entries);
	if (result.success) return entries;

	const problems = result.error.issues
		.map((issue) => {
			/* `[3, "children", 1, "label"]` reads better as a path than a list. */
			const at = issue.path.join(" > ");
			return `  ${at}: ${issue.message}`;
		})
		.join("\n");

	throw new Error(`${source} has entries a desk cannot draw:\n${problems}`);
}
