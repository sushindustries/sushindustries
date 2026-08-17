import type { ReactNode } from "react";

export interface SkeletonProps {
	/** Shape of the thing being waited for. */
	shape?: "line" | "block" | "circle";
	/** CSS size overrides; the shapes carry sensible defaults. */
	width?: string;
	/** Any CSS length. Overrides the shape - a taller `line` is one thick bar, not two. */
	height?: string;
}

/*
 * The wait, drawn as the thing being waited for. Three shapes cover every
 * loading state this site has needed: a line of text, a block of media, a
 * circle of avatar. The shimmer respects reduced motion by not existing -
 * a static placeholder still says "coming", and says it calmly.
 */
export function Skeleton({
	shape = "line",
	width,
	height,
}: SkeletonProps): ReactNode {
	return (
		<span
			className="skeleton"
			data-shape={shape}
			style={{ width, height }}
			aria-hidden="true"
		/>
	);
}
