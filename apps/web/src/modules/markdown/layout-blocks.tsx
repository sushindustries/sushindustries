import { Grid, type MarkdownBlockProps, Spacer } from "@sushindustries/ui";
import type { ReactNode } from "react";

/*
 * Layout, available to a Markdown author.
 *
 *   <!-- ::start:grid min="18rem" gap="4" -->
 *   ...anything...
 *   <!-- ::end:grid -->
 *
 *   <!-- ::start:spacer size="6" label="Later" -->
 *   <!-- ::end:spacer -->
 *
 * These exist because Markdown gives an author no way to say "these three
 * things go side by side" or "leave room here". Without them the workarounds
 * are an HTML table, an empty paragraph, or a `---` that means a thematic
 * break and merely looks like a line.
 *
 * Both are thin: parse two attributes, hand them to the component. The
 * component is in `packages/ui` and installable, so a reader who likes the grid
 * on this page can have the same grid, rather than the same idea.
 */

/** Attributes arrive as strings. A bad one falls back rather than throwing. */
function readStep(
	value: string | undefined,
	fallback: 1 | 2 | 3 | 4 | 5 | 6 | 7,
) {
	const step = Number(value);
	return step >= 1 && step <= 7
		? (step as 1 | 2 | 3 | 4 | 5 | 6 | 7)
		: fallback;
}

export function GridBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const columns = Number(attributes.columns);

	return (
		<Grid
			min={attributes.min || "16rem"}
			gap={readStep(attributes.gap, 4)}
			columns={
				columns === 2 || columns === 3 || columns === 4 ? columns : undefined
			}
		>
			{children}
		</Grid>
	);
}

export function SpacerBlock({ attributes }: MarkdownBlockProps): ReactNode {
	return (
		<Spacer
			size={readStep(attributes.size, 5)}
			rule={attributes.rule === "true"}
			label={attributes.label}
		/>
	);
}
