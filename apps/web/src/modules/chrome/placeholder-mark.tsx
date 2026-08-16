import type { ReactNode } from "react";

/*
 * PLACEHOLDER. Stands in for the real logo, which is not in yet, and makes no
 * brand claim of its own.
 *
 * It lives in the app rather than in `@sushindustries/ui` on purpose: the
 * rotation is the reusable part and that is `ScrollSpin`. Swapping in the real
 * mark means replacing this one file.
 */
export function PlaceholderMark(): ReactNode {
	return (
		<svg
			viewBox="0 0 200 200"
			fill="none"
			role="img"
			aria-label="Sushindustries"
		>
			<title>Sushindustries</title>
			<rect
				x="30"
				y="30"
				width="140"
				height="140"
				stroke="currentColor"
				strokeWidth="1.5"
				opacity="0.35"
			/>
			<circle
				cx="100"
				cy="100"
				r="70"
				stroke="currentColor"
				strokeWidth="1.5"
				opacity="0.5"
			/>
			<circle cx="100" cy="100" r="26" stroke="var(--accent)" strokeWidth="2" />
		</svg>
	);
}
