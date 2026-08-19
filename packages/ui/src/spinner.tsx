import type { ReactNode } from "react";

export interface SpinnerProps {
	/** Pixel size of the ring. */
	size?: number;
	/** What is being waited for. Announced, never drawn. */
	label?: string;
}

/*
 * A ring, turning. One element, one border, one animation - and a visually
 * hidden label, because a spinner with nothing to announce is an animation,
 * not a status. Reduced motion swaps the turn for a pulse: still alive,
 * nothing sweeping.
 */
export function Spinner({
	size = 18,
	label = "Loading",
}: SpinnerProps): ReactNode {
	return (
		<span className="inline-flex items-center" role="status">
			<span
				className="spinner"
				style={{ width: size, height: size }}
				aria-hidden="true"
			/>
			<span className="sr-only">{label}</span>
		</span>
	);
}
