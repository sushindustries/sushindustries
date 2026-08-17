import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { isValidElement, type ReactNode } from "react";
import { CodeBlock } from "./code-block";
import { createBlockDispatcher, type MarkdownBlocks } from "./markdown-blocks";
import { Ref, type ReferenceMap } from "./reference";

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
	file: string | undefined;
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
		"data-file"?: string;
	};

	if (typeof props.children !== "string") return undefined;

	const match = /language-([\w-]+)/.exec(props.className ?? "");

	return { code: props.children, lang: match?.[1], file: props["data-file"] };
}

// The literal type flows through untouched: annotating the return as
// `MarkdownComponents` widens it to the full intrinsic-elements record, and
// the spread at the call site stops type-checking.
function createComponents(references: ReferenceMap) {
	return {
		pre(props) {
			const fence = readFence(props.children);

			// Not a language-tagged fence - leave it as the parser emitted it.
			if (!fence) return <pre className="code-block">{props.children}</pre>;

			return (
				<CodeBlock code={fence.code} language={fence.lang} file={fence.file} />
			);
		},

		/*
		 * Inline code that names something this repo owns becomes a reference:
		 * the same text, now a link wearing a hover card. Matching is exact and
		 * the map is supplied by the host, so this stays a lookup rather than
		 * entity extraction - `Showcase` resolves because the app said it does.
		 *
		 * An already-linked mention is left alone: the parser renders the code
		 * element inside the anchor, and a hover card inside somebody's chosen
		 * link would be two navigations fighting over one word.
		 */
		code(props) {
			const text = typeof props.children === "string" ? props.children : "";
			const reference = references[text];

			if (reference) {
				return <Ref reference={reference}>{text}</Ref>;
			}

			return <code {...props} />;
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
}

const NO_REFERENCES: ReferenceMap = {};
const BASE_COMPONENTS = createComponents(NO_REFERENCES);

export interface MarkdownViewProps {
	/** Raw Markdown. Parsed to a bounded AST, so author content cannot inject markup. */
	source: string;
	/**
	 * Custom `<!-- ::start:name -->` blocks this document may use, keyed by
	 * name. This is how a Markdown file reaches a live React component without
	 * this package having to know what that component is.
	 */
	blocks?: MarkdownBlocks;
	/**
	 * Things this document may mention, keyed by the exact inline-code text
	 * that names them. A matching mention renders as a `Ref`: a link with a
	 * hover card carrying the target's own summary.
	 */
	references?: ReferenceMap;
}

export function MarkdownView({
	source,
	blocks = {},
	references = NO_REFERENCES,
}: MarkdownViewProps): ReactNode {
	const components =
		references === NO_REFERENCES
			? BASE_COMPONENTS
			: createComponents(references);

	return (
		<div className="prose">
			<Markdown
				extensions={EXTENSIONS}
				components={{
					...components,
					"md-comment-component": createBlockDispatcher(blocks),
				}}
			>
				{source}
			</Markdown>
		</div>
	);
}
