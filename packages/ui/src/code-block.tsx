import { createHighlightedCodeBlockProps } from "@tanstack/highlight/react";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { highlighter, resolveLanguage } from "./highlighter";

export interface CodeBlockProps {
	code: string;
	/** Fence language. Aliases like `bash` and `js` resolve; unknown falls back to plaintext. */
	language?: string;
	/** The copy button is the default; a caller showing a fragment can decline it. */
	copy?: boolean;
}

/*
 * One code block, highlighted and copyable, for every place code appears.
 *
 * This existed twice before it existed once: `MarkdownView` built the
 * highlighted markup for fences and the showcase block built the same markup
 * for demo source, and the copy button would have made it three. The
 * highlighting is synchronous, so a whole page of these renders during SSR
 * with nothing to re-run on hydration - only the button hydrates.
 *
 * `copyText` comes from the highlighter rather than from the prop, because the
 * highlighter already normalises the trailing newline and what lands on the
 * clipboard should be exactly what the block shows.
 */
export function CodeBlock({
	code,
	language,
	copy = true,
}: CodeBlockProps): ReactNode {
	const block = createHighlightedCodeBlockProps({
		highlighter,
		code: code.replace(/\n$/, ""),
		lang: resolveLanguage(language),
		className: "code-block",
	});

	const slab = (
		<div
			className={block.className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: highlighter output, escaped by renderTokens
			dangerouslySetInnerHTML={{ __html: block.htmlMarkup }}
		/>
	);

	if (!copy) return slab;

	const lang = block.lang && block.lang !== "plaintext" ? block.lang : null;

	return (
		<div className="code-shell">
			{slab}
			<div className="code-tools">
				{lang ? <span className="code-lang">{lang}</span> : null}
				<CopyButton text={block.copyText ?? code} />
			</div>
		</div>
	);
}
