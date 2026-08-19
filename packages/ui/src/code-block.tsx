import { createHighlightedCodeBlockProps } from "@tanstack/highlight/react";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { highlighter, resolveLanguage } from "./highlighter";
import { Icon } from "./icon";

export interface CodeBlockProps {
	/** The source. One trailing newline is dropped, so the copy is exactly what is shown. */
	code: string;
	/** Fence language. Aliases like `bash` and `js` resolve; unknown falls back to plaintext. */
	language?: string;
	/** The copy button is the default; a caller showing a fragment can decline it. */
	copy?: boolean;
	/** Filename from the fence's `file="..."` metadata, shown above the code. */
	file?: string;
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
	file,
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

	if (!copy && !file) return slab;

	const lang = block.lang && block.lang !== "plaintext" ? block.lang : null;

	return (
		<div className="code-shell">
			{file ? (
				<div className="code-file">
					<Icon name="file" size={12} />
					{file}
				</div>
			) : null}
			{slab}
			<div className="code-tools">
				{lang ? (
					<span className="code-lang">
						{/* The shell is the CLI; it gets the window it runs in. */}
						{lang === "shell" ? <Icon name="terminal" size={12} /> : null}
						{lang}
					</span>
				) : null}
				{copy ? <CopyButton text={block.copyText ?? code} /> : null}
			</div>
		</div>
	);
}
