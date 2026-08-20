import type { ReactNode } from "react";
import type { Space } from "./grid.tsx";

export interface SpacerProps {
	/** A step on the spacing scale. */
	size?: Space;
	/** Draw a hairline in the middle of the gap. */
	rule?: boolean;
	/** An optional caption sitting on the rule. Implies `rule`. */
	label?: string;
}

/*
 * Vertical space, on purpose rather than by accident.
 *
 * The argument against a spacer component is that margins should come from the
 * things being spaced, and inside a component that argument is right. This
 * exists for the one place it is wrong: Markdown, where the author has no
 * markup to attach a margin to and the only alternatives are an empty
 * paragraph or a `<br>`.
 *
 * Given that a spacer is going to be written anyway, it may as well take a step
 * on the scale rather than a number somebody picked, and it may as well be able
 * to draw the rule that a writer would otherwise reach for `---` to get - which
 * in Markdown is a semantic thematic break, not a decoration.
 *
 * `aria-hidden` when there is no label: a gap is not content.
 */
export function Spacer({ size = 5, rule, label }: SpacerProps): ReactNode {
	const drawn = rule || Boolean(label);

	return (
		<div
			className="spacer"
			data-size={size}
			data-rule={drawn || undefined}
			aria-hidden={label ? undefined : "true"}
		>
			{label ? <span className="spacer-label">{label}</span> : null}
		</div>
	);
}
