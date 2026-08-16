import {
	highlighter,
	type MarkdownBlockProps,
	resolveLanguage,
	Showcase,
} from "@sushindustries/ui";
import { createHighlightedCodeBlockProps } from "@tanstack/highlight/react";
import type { ReactNode } from "react";
import { findRegistryItem } from "../registry/registry.catalogue";
import { findDemo } from "../showcase/demos";
import { StackblitzEmbed } from "../showcase/stackblitz-embed";

/*
 * The showcase block.
 *
 *   <!-- ::start:showcase demo="scroll-spin" height="480" -->
 *   <!-- ::end:showcase -->
 *
 * One attribute does everything: the demo id is also the preview route, the
 * registry id and the source lookup. Documenting a new component is writing
 * that one line, because everything it needs already keys off the same name.
 *
 * Install commands are attached automatically for anything in the registry, so
 * "how do I get this" is never a thing an author has to remember to write.
 *
 * The StackBlitz tab is wired here rather than in `packages/ui` for the same
 * reason the code highlighter is: the Showcase component is a layout, not a
 * rendering pipeline, and the StackBlitz SDK is a host concern.
 */
export function ShowcaseBlock({ attributes }: MarkdownBlockProps): ReactNode {
	const id = attributes.demo;
	if (!id) return null;

	const demo = findDemo(id);
	const item = findRegistryItem(id);

	const height = Number(attributes.height);
	const resolvedHeight = Number.isFinite(height) && height > 0 ? height : 420;
	const title = attributes.title ?? id;
	const code = demo?.source;
	const language = demo?.language ?? "tsx";

	return (
		<Showcase
			src={`/preview/${id}?fit=full`}
			title={title}
			code={code}
			language={language}
			height={resolvedHeight}
			install={
				item
					? {
							tanstack: `tanstack add https://sushindustries.com/r/tanstack/${item.name}.json`,
							shadcn: `pnpm dlx shadcn@latest add https://sushindustries.com/r/shadcn/${item.name}.json`,
						}
					: undefined
			}
			// Passed in so `packages/ui` needs no highlighter of its own; the
			// Showcase component stays a layout, not a rendering pipeline.
			renderCode={(code, language) => {
				const block = createHighlightedCodeBlockProps({
					highlighter,
					code,
					lang: resolveLanguage(language),
					className: "code-block",
				});

				return (
					<div
						className={block.className}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: highlighter output, escaped by renderTokens
						dangerouslySetInnerHTML={{ __html: block.htmlMarkup }}
					/>
				);
			}}
			// The StackBlitz tab: a live, editable copy of the demo. Built from
			// the same source the Code tab shows, so the reader can change it and
			// see the result without leaving the page.
			renderStackblitz={
				code
					? (source, lang) => (
							<StackblitzEmbed
								title={title}
								code={source}
								language={lang}
							/>
						)
					: undefined
			}
		/>
	);
}
