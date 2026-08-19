import { CopyButton } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { REPO_IS_PUBLIC, REPO_URL } from "./repo";

/*
 * The head of every component and package page: the same document, offered to
 * every kind of reader.
 *
 * A person reads the page. A person setting up an agent copies the one-line
 * prompt. An agent fetches the Markdown. Each affordance is labelled with the
 * action it implies - the `.act` badges are the machine-readable half, so a
 * scraper can enumerate what the page offers without parsing button text.
 *
 * Site-specific on purpose, like the nav: it encodes this site's routes and
 * its GitHub remote, which is exactly the knowledge `packages/ui` must not
 * have. The pieces it is made of - CopyButton, the badges - are the library's.
 */

export interface DocActionsProps {
	/** The page's own Markdown, for "Copy page". */
	markdown: string;
	/** Absolute URL of the raw Markdown view, when the page serves one. */
	markdownUrl?: string;
	/** Absolute URL of the agent setup instructions, when the page has them. */
	promptUrl?: string;
	/** What the agent prompt calls the thing being set up. */
	title: string;
	/** Repo path of the source Markdown, for editing on GitHub. */
	editPath?: string;
	/**
	 * Repo directory where the Markdown *would* live, for pages that are
	 * generated and have no file yet. Renders a "Write this page" door that
	 * opens GitHub's new-file editor with the name and a starter body filled
	 * in - the create half of the edit button, for the pages editing cannot
	 * reach.
	 */
	writePath?: string;
	/** Starter body for the new file. Kept short: GitHub reads it off the URL. */
	writeBody?: string;
	/** `updated:` from the document's frontmatter, e.g. "2026-08-17". */
	updated?: string;
}

export function DocActions({
	markdown,
	markdownUrl,
	promptUrl,
	title,
	editPath,
	writePath,
	writeBody,
	updated,
}: DocActionsProps): ReactNode {
	const prompt = `Fetch and execute the appropriate instructions to set me up with ${title} from ${promptUrl}`;

	/*
	 * Reading time from the same Markdown the copy button copies. 200 words a
	 * minute, floored at one - a "0 min read" is a page apologising for
	 * existing.
	 */
	const minutes = Math.max(
		1,
		Math.round(markdown.split(/\s+/).filter(Boolean).length / 200),
	);

	/*
	 * No visible badges here. The action vocabulary is for machines - it lives
	 * in the prompt documents and in `data-action` where an API needs it, not
	 * as chips shouting verbs at a reader who can see the buttons.
	 */
	return (
		<div className="cq mt-4 flex items-center gap-2 wrap">
			{/*
			 * What the page is, as one group. Keeping the labels together means a
			 * narrow row breaks between the description and the controls rather
			 * than between two buttons.
			 */}
			<div className="doc-actions-meta">
				{updated ? (
					<span className="label">
						Last updated{" "}
						{new Date(updated).toLocaleDateString("en-US", {
							year: "numeric",
							month: "short",
							day: "numeric",
							timeZone: "UTC",
						})}
					</span>
				) : null}
				<span className="label">{minutes} min read</span>
			</div>

			{/* What you can do with it. */}
			<div className="doc-actions-set">
				<CopyButton text={markdown} label="Copy as Markdown" ground="paper" />
				{markdownUrl ? (
					<a
						className="copy-btn"
						data-ground="paper"
						data-action="read"
						href={markdownUrl}
					>
						View as Markdown
					</a>
				) : null}

				{/*
				 * One accent pill among quiet chips. The prompt works in Claude,
				 * Cursor or anything that can fetch a URL - one door, lit, beats
				 * three neutral ones nobody can tell apart.
				 */}
				{promptUrl ? (
					<CopyButton
						text={prompt}
						label="Agent setup"
						icon="spark"
						ground="accent"
					/>
				) : null}

				{/*
				 * The two GitHub doors, shown only when someone other than me could
				 * walk through them. Both open an editor on a file in the repo, and
				 * while the repo is private that editor is a 404 - an affordance
				 * that advertises an action the reader cannot take is worse than no
				 * affordance, because they have to click it to find out.
				 */}
				{REPO_IS_PUBLIC && editPath ? (
					<a
						className="copy-btn"
						data-ground="paper"
						data-action="edit"
						href={`${REPO_URL}/edit/main/${editPath}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Edit on GitHub
					</a>
				) : null}

				{REPO_IS_PUBLIC && !editPath && writePath ? (
					<a
						className="copy-btn"
						data-ground="paper"
						data-action="edit"
						href={`${REPO_URL}/new/main/${writePath}?filename=index.md${
							writeBody ? `&value=${encodeURIComponent(writeBody)}` : ""
						}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Write this page
					</a>
				) : null}
			</div>
		</div>
	);
}
