import { usePostHog } from "@posthog/react";
import { CopyButton, Icon } from "@sushindustries/ui";
import { safeRandomUUID } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { ClientOnly } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { createFeedbackCollection } from "./feedback-collection";

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

export function DocFeedback(props: DocFeedbackProps): ReactNode {
	return (
		<ClientOnly
			fallback={<VoteStatic {...props} voted={false} onVote={() => {}} />}
		>
			<DocFeedbackLive {...props} />
		</ClientOnly>
	);
}

/*
 * The collection opens an Electric stream, so it is built here rather than at
 * import time and torn down with the component: a module-scope one would hold
 * a live connection open for every page the reader has ever visited, and on
 * the server it would outlive the request that made it. `ClientOnly` already
 * keeps this off the server entirely - built the same way regardless, because
 * "always true today" is not the same guarantee as "correct by construction".
 */
function DocFeedbackLive({ page, markdown }: DocFeedbackProps): ReactNode {
	const posthog = usePostHog();
	const [hasVoted, setHasVoted] = useState(false);

	const collection = useMemo(() => createFeedbackCollection(page), [page]);

	const { data, isLoading } = useLiveQuery((q) => q.from({ v: collection }));

	function vote(value: "up" | "down"): void {
		setHasVoted(true);
		posthog.capture("documentation_feedback_submitted", {
			page_path: page,
			vote: value,
		});
		// A row a reader can see the instant they click - and the one thing
		// the old fire-and-forget fetch could not do: a failed POST rolls
		// this back out of the collection instead of the vote silently
		// never having happened.
		collection.insert({
			id: safeRandomUUID(),
			page,
			vote: value,
			createdAt: new Date().toISOString(),
		});
	}

	return (
		<VoteStatic
			page={page}
			markdown={markdown}
			voted={hasVoted}
			onVote={vote}
			// `undefined` while the collection is still syncing, same as the
			// pre-hydration fallback - a count of 0 that flashes to the real
			// number a moment later reads as the vote resetting, not loading.
			counts={
				isLoading
					? undefined
					: {
							up: data.filter((row) => row.vote === "up").length,
							down: data.filter((row) => row.vote === "down").length,
						}
			}
		/>
	);
}

interface VoteStaticProps extends DocFeedbackProps {
	voted: boolean;
	onVote: (value: "up" | "down") => void;
	/** Absent before hydration - the count is not worth blocking SSR for. */
	counts?: { up: number; down: number };
}

function VoteStatic({
	markdown,
	voted,
	onVote,
	counts,
}: VoteStaticProps): ReactNode {
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
						onClick={() => onVote("up")}
						aria-label="This page was useful"
					>
						<Icon name="check" size={12} />
						Yes
						{counts ? <span className="archive-count">{counts.up}</span> : null}
					</button>
					<button
						type="button"
						className="copy-btn"
						data-ground="paper"
						onClick={() => onVote("down")}
						aria-label="This page was not useful"
					>
						<Icon name="close" size={12} />
						No
						{counts ? (
							<span className="archive-count">{counts.down}</span>
						) : null}
					</button>
				</span>
			)}

			<CopyButton text={markdown} label="Copy as Markdown" ground="paper" />
		</>
	);
}
