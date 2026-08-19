import type { MarkdownBlockProps } from "@sushindustries/ui";
import { Hero } from "@sushindustries/ui";
import type { ReactNode } from "react";

/*
 * The hero block: a Hero, reachable from Markdown.
 *
 *   <!-- ::start:hero title="Why I build small" summary="One line under the
 *     heading" image="/media/why-small.webp" -->
 *   <!-- ::end:hero -->
 *
 * `summary` is a flat attribute rather than the block's children, on
 * purpose: `Hero` wraps `summary` in its own `<p>`, and the Markdown parser
 * already wraps whatever sits between the start and end comments in a `<p>`
 * of its own - passing that straight through would nest one paragraph
 * inside another. Anything actually written as the block's body lands in
 * Hero's bottom slot instead, which is built to take arbitrary content.
 *
 * `image` is one URL, not the `srcset` the component itself can take -
 * Markdown attributes are flat strings, so this is the honest ceiling of
 * what a block can express. It is also the same field a post or page sets
 * in frontmatter for its `og:image` (see `posts.schemas.ts`,
 * `pages.catalogue.ts`): setting both to the same file means the picture at
 * the top of the page is the picture an unfurled link shows, not two
 * different claims about what the page is.
 *
 * `variant` defaults to `doc` - a hero inside a document's own body is
 * describing that document, not standing in for the whole site the way the
 * home page's hero does.
 */
export function HeroBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const title = attributes.title;
	if (!title) return <>{children}</>;

	return (
		<Hero
			variant={attributes.variant === "landing" ? "landing" : "doc"}
			name={attributes.name}
			title={title}
			version={attributes.version}
			summary={attributes.summary}
			shot={
				attributes.image
					? {
							sources: [{ src: attributes.image, width: 960 }],
							alt: attributes.imageAlt ?? "",
							aspect: attributes.aspect ?? "16 / 10",
						}
					: undefined
			}
		>
			{children}
		</Hero>
	);
}
