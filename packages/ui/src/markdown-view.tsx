import { createHighlightedCodeBlockProps } from "@tanstack/highlight/react";
import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { isValidElement, type ReactNode } from "react";
import { highlighter, resolveLanguage } from "./highlighter";
import { createBlockDispatcher, type MarkdownBlocks } from "./markdown-blocks";

/*
 * Markdown, rendered - and the template layer that content files write against.
 *
 * Content on this site is `.md`, not TSX: posts, component docs, package
 * READMEs. That only works if Markdown can reach a little further than
 * paragraphs and lists, which is what the docs extensions provide:
 *
 *   > [!NOTE] Title          a callout
 *   <!-- ::start:tabs -->    tabbed sections, split on headings
 *   <!-- ::end:tabs -->
 *
 * Anything beyond that is passed in by the app through `components`, so a page
 * can map a custom block to a live React component without this package
 * knowing what that component is.
 *
 * TanStack Markdown parses and TanStack Highlight colours the fences, both
 * synchronously. That is what lets a whole document render during SSR with no
 * client JavaScript and nothing to re-highlight on hydration.
 *
 * The parser's trust boundary is why rendering author content is safe at all:
 * it emits a bounded AST instead of passing raw HTML through, so a document
 * cannot inject markup.
 */

const EXTENSIONS = docsMarkdownExtensions();

interface CodeFence {
	code: string;
	lang: string | undefined;
}

/*
 * A fence arrives as <pre><code className="language-ts">source</code></pre>.
 * The source and the language live on the inner <code>, so the <pre>
 * replacement reaches through one level to hand them to the highlighter.
 */
function readFence(children: ReactNode): CodeFence | undefined {
	if (!isValidElement(children)) return undefined;

	const props = children.props as { children?: unknown; className?: string };

	if (typeof props.children !== "string") return undefined;

	const match = /language-([\w-]+)/.exec(props.className ?? "");

	return { code: props.children, lang: match?.[1] };
}

const BASE_COMPONENTS = {
	pre(props) {
		const fence = readFence(props.children);

		// Not a language-tagged fence - leave it as the parser emitted it.
		if (!fence) return <pre className="code-block">{props.children}</pre>;

		const block = createHighlightedCodeBlockProps({
			highlighter,
			code: fence.code.replace(/\n$/, ""),
			lang: resolveLanguage(fence.lang),
			className: "code-block",
		});

		return (
			<div
				className={block.className}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: highlighter output, escaped by renderTokens
				dangerouslySetInnerHTML={{ __html: block.htmlMarkup }}
			/>
		);
	},

	a(props) {
		const external = props.href?.startsWith("http") ?? false;

		return (
			<a
				{...props}
				className="fg-accent"
				rel={external ? "noopener noreferrer" : props.rel}
				target={external ? "_blank" : props.target}
			/>
		);
	},
} satisfies MarkdownComponents;

export interface MarkdownViewProps {
	source: string;
	/**
	 * Custom `<!-- ::start:name -->` blocks this document may use, keyed by
	 * name. This is how a Markdown file reaches a live React component without
	 * this package having to know what that component is.
	 */
	blocks?: MarkdownBlocks;
}

export function MarkdownView({
	source,
	blocks = {},
}: MarkdownViewProps): ReactNode {
	return (
		<div className="prose">
			<Markdown
				extensions={EXTENSIONS}
				components={{
					...BASE_COMPONENTS,
					"md-comment-component": createBlockDispatcher(blocks),
				}}
			>
				{source}
			</Markdown>
		</div>
	);
}
