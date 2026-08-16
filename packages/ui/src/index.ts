/*
 * The barrel is safe here: everything in this package is client-safe React.
 * There is no `.server.ts` in this package and there must not be one — if a
 * component ever needs privileged data, it takes it as a prop.
 */
export { Archive, type ArchiveProps } from "./archive";
export {
	type Archive as ArchiveData,
	type ArchiveCategory,
	type ArchiveItem,
	archiveCategorySchema,
	archiveItemSchema,
	archiveSchema,
	parseArchive,
} from "./archive.schemas";
export { Card, type CardProps } from "./card";
export { Credit, type CreditProps } from "./credit";
export { DocAside, type DocAsideProps } from "./doc-aside";
export {
	type Frontmatter,
	parseFrontmatter,
	readList,
	readString,
} from "./frontmatter";
export { collectHeadings, type DocHeading } from "./headings";
export { highlighter, resolveLanguage } from "./highlighter";
export { Icon, type IconName, type IconProps } from "./icon";
export {
	createBlockDispatcher,
	type MarkdownBlockProps,
	type MarkdownBlocks,
} from "./markdown-blocks";
export { MarkdownView, type MarkdownViewProps } from "./markdown-view";
export { Reveal, type RevealProps } from "./reveal";
export { ScrollSpin, type ScrollSpinProps } from "./scroll-spin";
export { Section, type SectionProps } from "./section";
export { Showcase, type ShowcaseProps, type Viewport } from "./showcase";
export { SmoothScroll } from "./smooth-scroll";
