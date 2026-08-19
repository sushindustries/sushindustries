import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { parseMarkdown } from "@tanstack/markdown/parser";

export interface DocHeading {
	readonly id: string;
	readonly text: string;
	readonly level: number;
}

/*
 * The headings in a document, for building a table of contents.
 *
 * This parses the source a second time, which sounds wasteful and is not: the
 * parse is synchronous and runs on the server, where the result is part of the
 * HTML that gets cached. The alternative - threading the parsed document out of
 * the renderer - would make every caller carry an AST it does not otherwise
 * want.
 *
 * The same extensions are passed as the renderer uses, because heading
 * collection deliberately skips headings inside `tabs` blocks. Those headings
 * are tab labels, not sections, and listing them in a sidebar would offer to
 * scroll somewhere that is not visible.
 */
const EXTENSIONS = docsMarkdownExtensions();

export function collectHeadings(source: string, level = 2): DocHeading[] {
	const document = parseMarkdown(source, { extensions: EXTENSIONS });

	return (document.headings ?? [])
		.filter((heading) => heading.level === level)
		.map((heading) => ({
			id: heading.id,
			text: heading.text,
			level: heading.level,
		}));
}
