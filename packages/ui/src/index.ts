/*
 * The barrel is safe here: everything in this package is client-safe React.
 * There is no `.server.ts` in this package and there must not be one - if a
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
export { BootLoader, type BootLoaderProps } from "./boot-loader";
export {
	Breadcrumb,
	type BreadcrumbItem,
	type BreadcrumbProps,
} from "./breadcrumb";
export { Card, type CardProps } from "./card";
export { Clock, type ClockProps } from "./clock";
export { CodeBlock, type CodeBlockProps } from "./code-block";
export {
	CommandPalette,
	type CommandPaletteProps,
	type PaletteEntry,
} from "./command-palette";
export {
	ContextMenu,
	type ContextMenuProps,
	type ContextMenuState,
	type MenuAction,
	useContextMenu,
} from "./context-menu";
export { CopyButton, type CopyButtonProps } from "./copy-button";
export { Credit, type CreditProps } from "./credit";
export { DeskWindow, type DeskWindowProps } from "./desk-window";
export { Device, type DeviceProps } from "./device";
export {
	DEVICE_KINDS,
	DEVICES,
	type DeviceKind,
	type DeviceProfile,
	deviceKindFor,
	deviceQuery,
} from "./device-kinds";
export { DocAside, type DocAsideProps } from "./doc-aside";
export { Dock, type DockProps, type DockTask } from "./dock";
export {
	FolderShelf,
	type FolderShelfProps,
	flatten,
	matches,
	SEARCH_PATH,
	type ShelfEntry,
} from "./folder-shelf";
export {
	type Frontmatter,
	parseFrontmatter,
	readList,
	readString,
} from "./frontmatter";
export { Grid, type GridProps, type Space } from "./grid";
export { collectHeadings, type DocHeading } from "./headings";
export { highlighter, resolveLanguage } from "./highlighter";
export { Icon, type IconName, type IconProps } from "./icon";
export {
	createBlockDispatcher,
	type MarkdownBlockProps,
	type MarkdownBlocks,
} from "./markdown-blocks";
export { MarkdownView, type MarkdownViewProps } from "./markdown-view";
export {
	NavBar,
	type NavBarProps,
	type NavEntry,
	type NavItem,
} from "./nav-bar";
export { Pagination, type PaginationProps } from "./pagination";
export {
	Ref,
	type Reference,
	type ReferenceMap,
	type RefProps,
} from "./reference";
export { Reveal, type RevealProps } from "./reveal";
export { ScrollSpin, type ScrollSpinProps } from "./scroll-spin";
export { Section, type SectionProps } from "./section";
export {
	SHOWCASE_DEVICES,
	Showcase,
	type ShowcaseDevice,
	type ShowcaseProps,
} from "./showcase";
export { SmoothScroll } from "./smooth-scroll";
export { Spacer, type SpacerProps } from "./spacer";
export {
	type ThemeOption,
	ThemeToggle,
	type ThemeToggleProps,
} from "./theme-toggle";
export {
	Heading,
	type HeadingProps,
	Label,
	type LabelProps,
	Lead,
	type LeadProps,
} from "./typography";
export {
	type DeskApi,
	type DeskState,
	type DeskWindowState,
	EMPTY_DESK,
	useDeskState,
} from "./use-desk-state";
export { useDeviceKind } from "./use-device-kind";
export {
	type ScrollProgressOptions,
	useScrollProgress,
} from "./use-scroll-progress";
export {
	type ScrollTurn,
	type ScrollTurnOptions,
	useScrollTurn,
} from "./use-scroll-turn";
