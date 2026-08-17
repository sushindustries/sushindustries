import type { MarkdownBlockProps } from "@sushindustries/ui";
import { Card, type IconName } from "@sushindustries/ui";
import type { ReactNode } from "react";

/*
 * The card block: a Card, reachable from Markdown.
 *
 *   <!-- ::start:card title="Reveal" href="/components/reveal" meta="v0.1.0" -->
 *   Body copy, in Markdown.
 *   <!-- ::end:card -->
 *
 * `image` makes it the image card, `icon` + `tone` the category card - the
 * same props the component grows its shapes from, spelled as attributes. Put
 * several inside a `grid` block and a page has a card grid without a line of
 * JSX, which is what makes layout pages writable as content.
 */
export function CardBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const title = attributes.title;
	if (!title) return <>{children}</>;

	const card = (
		<Card
			title={title}
			href={attributes.href}
			meta={attributes.meta}
			image={attributes.image}
			imageAlt={attributes.imageAlt ?? ""}
			icon={attributes.icon as IconName | undefined}
			tone={attributes.tone}
		>
			{children}
		</Card>
	);

	/*
	 * `span` claims grid track: "2", "3" or "full". Carried by a wrapper
	 * because the claim belongs to the cell, not to the card - the same card
	 * spans nothing outside a grid.
	 */
	if (attributes.span) {
		return <div data-span={attributes.span}>{card}</div>;
	}

	return card;
}
