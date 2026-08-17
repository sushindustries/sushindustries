import type { ReactNode } from "react";

export interface BadgeProps {
	children: ReactNode;
	/** Colour family, resolved by the stylesheet. Absent is the quiet default. */
	tone?: string;
}

/*
 * A word wearing a fill. The tones are the site's category pairs - a badge
 * invents no colour of its own, so "motion" on a badge and "motion" in the
 * nav are visibly the same claim.
 */
export function Badge({ children, tone }: BadgeProps): ReactNode {
	return (
		<span className="badge" data-tone={tone}>
			{children}
		</span>
	);
}
