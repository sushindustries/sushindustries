/*
 * The barrel is safe here: everything in this package is client-safe React.
 * There is no `.server.ts` in this package and there must not be one - if a
 * component ever needs privileged data, it takes it as a prop.
 */

export {
	Accordion,
	type AccordionItem,
	type AccordionProps,
} from "./accordion.tsx";
export { Alert, type AlertProps } from "./alert.tsx";
export {
	type Archive as ArchiveData,
	type ArchiveCategory,
	type ArchiveItem,
	archiveCategorySchema,
	archiveItemSchema,
	archiveSchema,
	parseArchive,
} from "./archive.schemas.ts";
export { Archive, type ArchiveProps } from "./archive.tsx";
export { AspectRatio, type AspectRatioProps } from "./aspect-ratio.tsx";
export {
	Avatar,
	AvatarGroup,
	type AvatarGroupProps,
	type AvatarProps,
} from "./avatar.tsx";
export { Badge, type BadgeProps } from "./badge.tsx";
export {
	BarChart,
	type BarChartDatum,
	type BarChartProps,
} from "./bar-chart.tsx";
export { BootLoader, type BootLoaderProps } from "./boot-loader.tsx";
export {
	Breadcrumb,
	type BreadcrumbItem,
	type BreadcrumbProps,
} from "./breadcrumb.tsx";
export { Button, type ButtonProps } from "./button.tsx";
export { Card, type CardProps } from "./card.tsx";
export { Checkbox, type CheckboxProps } from "./checkbox.tsx";
export { Clock, type ClockProps } from "./clock.tsx";
export { CodeBlock, type CodeBlockProps } from "./code-block.tsx";
export { Collapsible, type CollapsibleProps } from "./collapsible.tsx";
export {
	CommandPalette,
	type CommandPaletteProps,
	type PaletteEntry,
} from "./command-palette.tsx";
export * from "./consent.tsx";
export {
	ContextMenu,
	type ContextMenuProps,
	type ContextMenuState,
	type MenuAction,
	useContextMenu,
} from "./context-menu.tsx";
export { CopyButton, type CopyButtonProps } from "./copy-button.tsx";
export { Credit, type CreditProps } from "./credit.tsx";
export {
	DataTable,
	type DataTableColumn,
	type DataTableProps,
} from "./data-table.tsx";
export { DeskWindow, type DeskWindowProps } from "./desk-window.tsx";
export { Device, type DeviceProps } from "./device.tsx";
export {
	DEVICE_KINDS,
	DEVICES,
	type DeviceKind,
	type DeviceProfile,
	deviceKindFor,
	deviceQuery,
} from "./device-kinds.ts";
export { Dialog, type DialogProps } from "./dialog.tsx";
export { DocAside, type DocAsideProps } from "./doc-aside.tsx";
export {
	DocNav,
	type DocNavItem,
	type DocNavProps,
	type DocNavSection,
} from "./doc-nav.tsx";
export { Dock, type DockProps, type DockTask } from "./dock.tsx";
export {
	type DropdownItem,
	DropdownMenu,
	type DropdownMenuProps,
} from "./dropdown-menu.tsx";
export { Empty, type EmptyProps } from "./empty.tsx";
export { Field, type FieldProps } from "./field.tsx";
export {
	FolderShelf,
	type FolderShelfProps,
	flatten,
	matches,
	SEARCH_PATH,
	type ShelfEntry,
} from "./folder-shelf.tsx";
export {
	type Frontmatter,
	parseFrontmatter,
	readList,
	readString,
	splitFrontmatter,
} from "./frontmatter.ts";
export { Grid, type GridProps, type Space } from "./grid.tsx";
export { collectHeadings, type DocHeading } from "./headings.ts";
export {
	Hero,
	type HeroFact,
	type HeroProps,
	type HeroShot,
	type HeroShotSource,
} from "./hero.tsx";
export { highlighter, resolveLanguage } from "./highlighter.ts";
export { Icon, type IconName, type IconProps } from "./icon.tsx";
export { Input, type InputProps } from "./input.tsx";
export { Item, type ItemProps } from "./item.tsx";
export { Kbd, type KbdProps } from "./kbd.tsx";
export {
	createBlockDispatcher,
	type MarkdownBlockProps,
	type MarkdownBlocks,
} from "./markdown-blocks.tsx";
export { MarkdownView, type MarkdownViewProps } from "./markdown-view.tsx";
export { NativeSelect, type NativeSelectProps } from "./native-select.tsx";
export {
	NavBar,
	type NavBarProps,
	type NavEntry,
	type NavItem,
} from "./nav-bar.tsx";
export { Pagination, type PaginationProps } from "./pagination.tsx";
export { Progress, type ProgressProps } from "./progress.tsx";
export { Questions, type QuestionsProps } from "./questions.tsx";
export {
	RadioGroup,
	type RadioGroupProps,
	type RadioOption,
} from "./radio-group.tsx";
export {
	Ref,
	type Reference,
	type ReferenceMap,
	type RefProps,
} from "./reference.tsx";
export { Reveal, type RevealProps } from "./reveal.tsx";
export { ScrollArea, type ScrollAreaProps } from "./scroll-area.tsx";
export { ScrollSpin, type ScrollSpinProps } from "./scroll-spin.tsx";
export { SecretReveal, type SecretRevealProps } from "./secret-reveal.tsx";
export { Section, type SectionProps } from "./section.tsx";
export { Separator, type SeparatorProps } from "./separator.tsx";
export { Sheet, type SheetProps } from "./sheet.tsx";
export {
	SHOWCASE_DEVICES,
	Showcase,
	type ShowcaseDevice,
	type ShowcaseProps,
} from "./showcase.tsx";
export { Skeleton, type SkeletonProps } from "./skeleton.tsx";
export { Slider, type SliderProps } from "./slider.tsx";
export { SmoothScroll } from "./smooth-scroll.tsx";
export { Spacer, type SpacerProps } from "./spacer.tsx";
export { Spinner, type SpinnerProps } from "./spinner.tsx";
export { Switch, type SwitchProps } from "./switch.tsx";
export {
	Table,
	type TableColumn,
	type TableProps,
} from "./table.tsx";
export { Textarea, type TextareaProps } from "./textarea.tsx";
export {
	type ThemeOption,
	ThemeToggle,
	type ThemeToggleProps,
} from "./theme-toggle.tsx";
export {
	ToastProvider,
	type ToastProviderProps,
	useToast,
} from "./toast.tsx";
export {
	Toggle,
	ToggleGroup,
	type ToggleGroupProps,
	type ToggleProps,
} from "./toggle.tsx";
export { Tooltip, type TooltipProps } from "./tooltip.tsx";
export { TypedMark, type TypedMarkProps } from "./typed-mark.tsx";
export {
	Heading,
	type HeadingProps,
	Label,
	type LabelProps,
	Lead,
	type LeadProps,
	Text,
	type TextProps,
} from "./typography.tsx";
export {
	type DeskApi,
	type DeskState,
	type DeskWindowState,
	EMPTY_DESK,
	useDeskState,
} from "./use-desk-state.ts";
export { useDeviceKind } from "./use-device-kind.ts";
export {
	type DragPlaceHandle,
	type DragPlaceOptions,
	useDragPlace,
} from "./use-drag-place.ts";
export {
	type ScrollProgressOptions,
	useScrollProgress,
} from "./use-scroll-progress.ts";
export {
	type ScrollTurn,
	type ScrollTurnOptions,
	useScrollTurn,
} from "./use-scroll-turn.ts";
export {
	VideoPlayer,
	type VideoPlayerProps,
	type VideoProvider,
	type VideoTheme,
	type VideoVariant,
} from "./video-player.tsx";
export { Workbench, type WorkbenchProps } from "./workbench.tsx";
