import type { ReactNode } from "react";
import { Icon } from "./icon";

export interface CollapsibleProps {
	/**
	 * The always-visible line.
	 *
	 * A node rather than a string, so a section can put its own icon beside its
	 * name. It was a string, which forced every caller that wanted one to give
	 * up the component and hand-roll a `<details>` - which is the shape of a
	 * prop that is one type too narrow.
	 *
	 * Keep it to a line. This is a summary element: it is the click target and
	 * the thing a screen reader announces for the whole section, so a paragraph
	 * in here is a paragraph read out before anything else.
	 */
	summary: ReactNode;
	children: ReactNode;
	/** Open on the first paint. After that the reader's toggle stands - nothing re-forces it. */
	defaultOpen?: boolean;
}

/*
 * One <details>, dressed. The single-item accordion is its own component
 * because the composed one imposes a list shape - a collapsible inside prose
 * is a sentence that opens, not a stack of one.
 */
export function Collapsible({
	summary,
	children,
	defaultOpen,
}: CollapsibleProps): ReactNode {
	return (
		<details className="accordion-item" open={defaultOpen}>
			<summary className="accordion-summary">
				{summary}
				<span className="accordion-chevron" aria-hidden="true">
					<Icon name="chevron" size={14} />
				</span>
			</summary>
			<div className="accordion-body text-sm fg-dim">{children}</div>
		</details>
	);
}
