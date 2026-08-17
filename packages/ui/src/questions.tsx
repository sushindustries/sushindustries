import type { ReactNode } from "react";

/*
 * The questions a page expects to be asked.
 *
 * A page explains something; a reader arrives with a question about it. This
 * is the list of the three or four that actually get asked, written by whoever
 * wrote the page, sitting on the page itself.
 *
 * Two reasons it is a component rather than a bullet list. It is answerable:
 * given an `onAsk`, each question is a button that puts itself to the
 * assistant, so the reader gets an answer without retyping. And it is
 * declarable: the questions are content, so they are written in Markdown
 * beside the prose they belong to and cannot drift from it.
 *
 * Without `onAsk` it degrades to exactly what it is - a list of questions -
 * which is what renders on the server and what a reader with no JavaScript
 * sees. That is the whole fallback, and it is a legitimate document.
 */

export interface QuestionsProps {
	/**
	 * What to call the list. A heading rather than a hard-coded string because
	 * "Common questions" and "Try asking" are different promises.
	 */
	readonly heading?: string;
	readonly questions: readonly string[];
	/**
	 * Put the question to something that can answer it. Given this, each entry
	 * is a button; without it, a list item.
	 */
	readonly onAsk?: (question: string) => void;
	/** Heading level, so the page outline stays correct. Defaults to `h2`. */
	readonly level?: 2 | 3 | 4;
}

export function Questions({
	heading,
	questions,
	onAsk,
	level = 2,
}: QuestionsProps): ReactNode {
	if (questions.length === 0) return null;

	const Heading = `h${level}` as "h2" | "h3" | "h4";

	return (
		<section className="questions">
			{heading ? (
				<Heading className="questions-title">{heading}</Heading>
			) : null}

			<ul className="questions-list">
				{questions.map((question) => (
					/*
					 * The question is the key. Two identical questions on one page
					 * are a mistake in the content, not a case to support with an
					 * index - and an index key here would reorder wrongly the first
					 * time a page generates its list from anything but a literal.
					 */
					<li key={question}>
						{onAsk ? (
							<button
								type="button"
								className="questions-ask"
								onClick={() => onAsk(question)}
							>
								{question}
							</button>
						) : (
							<span className="questions-ask" data-static="true">
								{question}
							</span>
						)}
					</li>
				))}
			</ul>
		</section>
	);
}
