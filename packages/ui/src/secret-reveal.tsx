import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";

export interface SecretRevealProps {
	/** The thing being shown. A token, a link, a one-time code. */
	value: string;

	/** What the copy button says at rest. */
	label?: string;

	/**
	 * Whether to offer a copy button at all.
	 *
	 * Off for the snippets that merely *contain* a truncated credential - a
	 * registration command with a prefix and an ellipsis in it is an
	 * illustration, and a copy button on an illustration produces a command
	 * that does not work.
	 */
	copy?: boolean;

	/** Anything to sit under the box: a caveat, a next step, a dismiss button. */
	children?: ReactNode;
}

/*
 * A secret, shown once.
 *
 * This was written out five times before it became a component - twice in the
 * studio, twice on the page where somebody collects a token, once for an
 * invitation link - and the fifth copy is what made the case. They were not
 * quite identical, which is the actual cost: one of them wrapped and one
 * scrolled, so one of them showed a token with its tail off the right-hand
 * edge, which is a token somebody copies half of.
 *
 * The two rules it exists to keep:
 *
 *   **It wraps, never scrolls.** A document that scrolls loses nothing; a
 *   credential whose end is out of view is a support conversation.
 *
 *   **`user-select: all`**, so one click takes the whole thing. The clipboard
 *   API only exists in a secure context, so on a laptop over plain http the
 *   copy button silently never confirms - and selecting by hand is the path
 *   that always works.
 */
export function SecretReveal({
	value,
	label = "Copy",
	copy = true,
	children,
}: SecretRevealProps): ReactNode {
	return (
		<div className="flex col gap-2">
			<pre className="secret-value">
				<code>{value}</code>
			</pre>

			{copy || children ? (
				<div className="flex wrap items-center gap-2">
					{copy ? (
						<CopyButton text={value} ground="paper" label={label} />
					) : null}
					{children}
				</div>
			) : null}
		</div>
	);
}
