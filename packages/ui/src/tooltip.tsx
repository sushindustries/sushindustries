import type { ReactNode } from "react";

export interface TooltipProps {
	/** The one line. A tooltip that needs two is a hover card. */
	label: string;
	children: ReactNode;
}

/*
 * A title attribute with better clothes. CSS reveals it on hover and on
 * focus-within, so keyboards get it too; the label is in the markup, not in
 * `title=`, so readers see one consistent thing. It never carries controls -
 * the reference hover card exists for anything that can be entered.
 */
export function Tooltip({ label, children }: TooltipProps): ReactNode {
	return (
		<span className="tooltip">
			{children}
			<span className="tooltip-bubble" role="tooltip">
				{label}
			</span>
		</span>
	);
}
