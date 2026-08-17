import type { MarkdownBlockProps } from "@sushindustries/ui";
import { Questions } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { askAssistant } from "./questions.store";

/*
 * The questions block: the questions a page expects, reachable from Markdown.
 *
 *   <!-- ::start:questions heading="Common questions" -->
 *   - How do I install a component?
 *   - Do I need the whole library?
 *   - What happens when a component updates?
 *   <!-- ::end:questions -->
 *
 * The list is written as a Markdown list, because that is what it is - a page
 * with this block still reads correctly as a plain document, and the questions
 * are reviewable in the diff of the page they belong to rather than in a table
 * somewhere else.
 *
 * Pressing one puts it to the assistant. That is the point of writing them
 * down: a question a reader can see is a question they can have answered
 * without composing it themselves, and the ones worth listing are exactly the
 * ones people were going to ask anyway.
 */

/*
 * The questions, taken from the list the author wrote.
 *
 * `children` is already-rendered Markdown, so the text is read out of the
 * React elements rather than re-parsed. Anything that is not a list item is
 * ignored: a stray paragraph inside the block is a typo, and rendering it as a
 * question would put words in the author's mouth.
 */
function textOf(node: ReactNode): string {
	if (typeof node === "string") return node;
	if (typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join("");

	if (node && typeof node === "object" && "props" in node) {
		const props = (node as { props?: { children?: ReactNode } }).props;
		return textOf(props?.children);
	}

	return "";
}

function itemsOf(node: ReactNode): string[] {
	const found: string[] = [];

	const walk = (current: ReactNode): void => {
		if (Array.isArray(current)) {
			for (const child of current) walk(child);
			return;
		}

		if (!current || typeof current !== "object" || !("type" in current)) {
			return;
		}

		const element = current as {
			type: unknown;
			props?: { children?: ReactNode };
		};

		if (element.type === "li") {
			const text = textOf(element.props?.children).trim();
			if (text) found.push(text);
			return;
		}

		walk(element.props?.children);
	};

	walk(node);
	return found;
}

export function QuestionsBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const questions = itemsOf(children);

	// Nothing to show, and nothing to guess at. Render what was written.
	if (questions.length === 0) return <>{children}</>;

	const level = Number(attributes.level);

	return (
		<Questions
			heading={attributes.heading ?? "Common questions"}
			questions={questions}
			onAsk={askAssistant}
			level={level === 3 || level === 4 ? level : 2}
		/>
	);
}
