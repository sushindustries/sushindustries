import { Store } from "@tanstack/store";

/*
 * A question, on its way from a page to the assistant.
 *
 * The two are far apart in the tree - a question block is somewhere inside a
 * rendered Markdown document, the assistant is mounted once in the site
 * chrome - and threading a callback between them would mean every route that
 * renders Markdown knowing the assistant exists. A store is the seam: the
 * block writes, the assistant reads, and neither imports the other.
 *
 * The same shape as `video.store.ts`, for the same reason.
 *
 * It holds a question rather than a boolean because the assistant needs to
 * know *which* one, and it is cleared by the reader rather than the writer:
 * whoever consumes a question is the only one who knows it has been asked.
 * Leaving it set would re-ask it on the next render.
 */
export const askedQuestion = new Store<string | null>(null);

export function askAssistant(question: string): void {
	askedQuestion.setState(() => question);
}

export function clearAskedQuestion(): void {
	askedQuestion.setState(() => null);
}
