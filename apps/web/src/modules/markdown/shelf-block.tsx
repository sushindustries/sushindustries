import type { MarkdownBlockProps } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { SiteShelf } from "../chrome/site-shelf";

/*
 * The shelf, in any Markdown file.
 *
 *   <!-- ::start:shelf -->
 *   <!-- ::end:shelf -->
 *
 * No attributes: what is on the shelf is `content/shelf.md`, and a block that
 * could override that would be a second place to look when a folder is wrong.
 */
export function ShelfBlock(_: MarkdownBlockProps): ReactNode {
	return <SiteShelf />;
}
