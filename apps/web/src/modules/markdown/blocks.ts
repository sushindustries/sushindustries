import type { MarkdownBlocks } from "@sushindustries/ui";
import { CardBlock } from "./card-block";
import { GridBlock, SpacerBlock } from "./layout-blocks";
import { ShelfBlock } from "./shelf-block";
import { ShowcaseBlock } from "./showcase-block";
import { VideoBlock } from "./video-block";
import { ViewerBlock } from "./viewer-block";

/*
 * The custom blocks any document on this site may use.
 *
 * One map, passed to every `MarkdownView`, so a block works the same in a post,
 * in a component doc and in a package README. Adding a block here makes it
 * available everywhere at once - which is the point, because a block that only
 * works on one page is a page, not a block.
 */
export const BLOCKS: MarkdownBlocks = {
	card: CardBlock,
	showcase: ShowcaseBlock,
	viewer: ViewerBlock,
	video: VideoBlock,
	grid: GridBlock,
	spacer: SpacerBlock,
	shelf: ShelfBlock,
};
