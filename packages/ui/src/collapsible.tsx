import type { ReactNode } from "react";
import { Icon } from "./icon";

export interface CollapsibleProps {
	/** The always-visible line. */
	summary: string;
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
