import type { ReactNode } from "react";

/*
 * A consent question that knows nothing about what it is consenting to.
 *
 * The analytics SDK, the storage of the answer and the law being satisfied
 * all belong to the host - this component only renders the question and
 * reports which button was pressed. That is what keeps it installable: a
 * consent bar hard-wired to one vendor is that vendor's plugin, not a
 * component.
 *
 * Non-modal by design, and that is the legal shape, not a styling taste: the
 * visitor is allowed to ignore the question and keep reading, so there is no
 * backdrop, no focus trap, and the page behind stays live. Both buttons
 * render at the same size because declining must cost the same click as
 * accepting.
 *
 * `role="region"` with a label, not `role="dialog"`: a screen reader user
 * should find it when they look, not be interrupted by it.
 */

export interface ConsentProps {
	/** Render the bar. Keep it `false` once an answer has been recorded. */
	open: boolean;
	/** The question, e.g. what is measured and why. Plain content, no chrome. */
	children: ReactNode;
	/** Pressed "yes". The host records the answer and starts measuring. */
	onAccept: () => void;
	/** Pressed "no". The host records the answer and stays dark. */
	onDecline: () => void;
	/** Accessible name for the region and the default heading of the bar. */
	label?: string;
	acceptLabel?: string;
	declineLabel?: string;
}

export function Consent({
	open,
	children,
	onAccept,
	onDecline,
	label = "Privacy",
	acceptLabel = "Allow",
	declineLabel = "Decline",
}: ConsentProps): ReactNode {
	if (!open) return null;

	return (
		<section className="consent" aria-label={label}>
			<div className="fg-dim text-sm">{children}</div>
			<div className="consent-actions">
				<button type="button" className="btn-ghost" onClick={onDecline}>
					{declineLabel}
				</button>
				<button type="button" className="btn" onClick={onAccept}>
					{acceptLabel}
				</button>
			</div>
		</section>
	);
}
