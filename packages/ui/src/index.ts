/*
 * The barrel is safe here: everything in this package is client-safe React.
 * There is no `.server.ts` in this package and there must not be one — if a
 * component ever needs privileged data, it takes it as a prop.
 */
export { Card, type CardProps } from "./card";
export { Credit, type CreditProps } from "./credit";
export {
	type Frontmatter,
	parseFrontmatter,
	readList,
	readString,
} from "./frontmatter";
export {
	createBlockDispatcher,
	type MarkdownBlockProps,
	type MarkdownBlocks,
} from "./markdown-blocks";
export { MarkdownView, type MarkdownViewProps } from "./markdown-view";
export { Reveal, type RevealProps } from "./reveal";
export { ScrollSpin, type ScrollSpinProps } from "./scroll-spin";
export { Section, type SectionProps } from "./section";
export { SmoothScroll } from "./smooth-scroll";
