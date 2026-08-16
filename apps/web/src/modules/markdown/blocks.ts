import type { MarkdownBlocks } from "@sushindustries/ui";
import { ShowcaseBlock } from "./showcase-block";
import { ViewerBlock } from "./viewer-block";

/*
 * The custom blocks any document on this site may use.
 *
 * One map, passed to every `MarkdownView`, so a block works the same in a post,
 * in a component doc and in a package README. Adding a block here makes it
 * available everywhere at once — which is the point, because a block that only
 * works on one page is a page, not a block.
 */
export const BLOCKS: MarkdownBlocks = {
	showcase: ShowcaseBlock,
	viewer: ViewerBlock,
};
