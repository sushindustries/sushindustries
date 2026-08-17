import type { ReactNode } from "react";

export interface AspectRatioProps {
	/** Width over height: 16/9, 1, 4/3. */
	ratio?: number;
	children: ReactNode;
}

/*
 * A box that keeps its shape. CSS `aspect-ratio` does all of it; the
 * component exists so the number is a prop rather than an inline style
 * somebody has to remember the syntax for, and so whatever is inside fills
 * the box edge to edge by default.
 */
export function AspectRatio({
	ratio = 16 / 9,
	children,
}: AspectRatioProps): ReactNode {
	return (
		<div className="ratio" style={{ aspectRatio: ratio }}>
			{children}
		</div>
	);
}
