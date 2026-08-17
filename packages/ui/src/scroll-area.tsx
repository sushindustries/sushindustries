import type { ReactNode } from "react";

export interface ScrollAreaProps {
	children: ReactNode;
	/** CSS max-height; scrolling starts past it. */
	maxHeight?: string;
}

/*
 * An inner scroll container that gets the two things every one here needs:
 * the site's thin scrollbar, and `data-lenis-prevent` so the smooth scroller
 * hands the wheel back. Both were forgotten separately often enough that the
 * pair earned a name.
 */
export function ScrollArea({
	children,
	maxHeight = "20rem",
}: ScrollAreaProps): ReactNode {
	return (
		<div className="scroll-area" style={{ maxHeight }} data-lenis-prevent>
			{children}
		</div>
	);
}
