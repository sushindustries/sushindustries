import { CopyButton, Icon } from "@sushindustries/ui";
import { type ReactNode, useState } from "react";

/*
 * The aside's footer: was this page useful, and take it with you.
 *
 * A vote posts once and then thanks - the buttons disappear because feedback
 * given twice is feedback weighted twice. The copy chip is the same page
 * Markdown the header offers; it lives here too because the reader who wants
 * it has usually just finished the page, and the header is a screen away.
 */
export interface DocFeedbackProps {
	/** Route path identifying the page being judged. */
	page: string;
	/** The page's own Markdown, for the copy chip. */
	markdown: string;
}

export function DocFeedback({ page, markdown }: DocFeedbackProps): ReactNode {
	const [voted, setVoted] = useState(false);

	function vote(value: "up" | "down"): void {
		setVoted(true);
		void fetch("/api/feedback", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ page, vote: value }),
		}).catch(() => {
			/* A lost vote is not worth an error state. */
		});
	}

	return (
		<>
			{voted ? (
				<span className="label">Thanks</span>
			) : (
				<span className="flex items-center gap-2">
					<span className="label">Useful?</span>
					<button
						type="button"
						className="copy-btn"
						data-ground="paper"
						onClick={() => vote("up")}
						aria-label="This page was useful"
					>
						<Icon name="check" size={12} />
						Yes
					</button>
					<button
						type="button"
						className="copy-btn"
						data-ground="paper"
						onClick={() => vote("down")}
						aria-label="This page was not useful"
					>
						<Icon name="close" size={12} />
						No
					</button>
				</span>
			)}

			<CopyButton text={markdown} label="Copy as Markdown" ground="paper" />
		</>
	);
}
