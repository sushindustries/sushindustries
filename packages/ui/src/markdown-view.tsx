import { createHighlightedCodeBlockProps } from "@tanstack/highlight/react";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { isValidElement, type ReactNode } from "react";
import { highlighter, resolveLanguage } from "./highlighter";

/*
 * README markdown, rendered.
 *
 * TanStack Markdown parses; TanStack Highlight colours the fences. Both run
 * synchronously, which is what makes this work under SSR with no client
 * JavaScript at all — the highlighted HTML is in the server response, and
 * nothing re-highlights on hydration.
 *
 * The parser's trust boundary is the reason this is safe to render at all: it
 * emits a bounded AST rather than passing raw HTML through, so a README cannot
 * inject markup. My own content today, but that will not always be true.
 */

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

	const props = children.props as {
		children?: unknown;
		className?: string;
	};

	if (typeof props.children !== "string") return undefined;

	const match = /language-([\w-]+)/.exec(props.className ?? "");

	return { code: props.children, lang: match?.[1] };
}

const components = {
	pre(props) {
		const fence = readFence(props.children);

		// Not a language-tagged fence — leave it as the parser emitted it.
		if (!fence) return <pre className="code-block">{props.children}</pre>;

		const block = createHighlightedCodeBlockProps({
			highlighter,
			code: fence.code.replace(/\n$/, ""),
			lang: resolveLanguage(fence.lang),
			className: "code-block",
		});

		return (
			/*
			 * The markup here is the highlighter's own token renderer output, and
			 * that renderer escapes the source it was handed. The string never
			 * contains anything from the Markdown document that the parser did not
			 * already reduce to a code-fence value, so there is no path from
			 * document text to live markup.
			 */
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
}

export function MarkdownView({ source }: MarkdownViewProps): ReactNode {
	return (
		<div className="prose">
			<Markdown components={components}>{source}</Markdown>
		</div>
	);
}
