import type { ReactNode } from "react";

export interface SeparatorProps {
	/** Vertical needs a height from its container; horizontal is the default. */
	orientation?: "horizontal" | "vertical";
	/** Purely visual dividers should not be announced. */
	decorative?: boolean;
}

/*
 * A rule. `<hr>` when it separates content (announced), a styled span when it
 * is furniture (silent) - the `decorative` flag is an accessibility decision,
 * not a styling one.
 */
export function Separator({
	orientation = "horizontal",
	decorative = false,
}: SeparatorProps): ReactNode {
	if (decorative) {
		return (
			<span
				className="separator"
				data-orientation={orientation}
				aria-hidden="true"
			/>
		);
	}

	return <hr className="separator" data-orientation={orientation} />;
}
