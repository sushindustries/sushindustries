/*
 * The barrel is safe here: everything in this package is client-safe React.
 * There is no `.server.ts` in this package and there must not be one — if a
 * component ever needs privileged data, it takes it as a prop.
 */
export { Card, type CardProps } from "./card";
export { MarkdownView, type MarkdownViewProps } from "./markdown-view";
export { Reveal, type RevealProps } from "./reveal";
export { ScrollSpin, type ScrollSpinProps } from "./scroll-spin";
export { Section, type SectionProps } from "./section";
export { SmoothScroll } from "./smooth-scroll";
