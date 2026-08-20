import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";

export interface AccordionItem {
	readonly id: string;
	readonly title: string;
	readonly content: ReactNode;
}

export interface AccordionProps {
	/** Rendered in order and keyed by `id`. Each opens without closing the others. */
	items: readonly AccordionItem[];
	/** Ids open on first render. */
	defaultOpen?: readonly string[];
}

/*
 * <details>, stacked. Every behaviour - toggle, keyboard, announcement,
 * find-in-page opening the right panel - ships in the element, which is why
 * this component is markup and a chevron and nothing else. Items open
 * independently; an accordion that closes its neighbours is a radio group
 * wearing a disclosure costume.
 */
export function Accordion({
	items,
	defaultOpen = [],
}: AccordionProps): ReactNode {
	return (
		<div className="accordion">
			{items.map((item) => (
				<details
					key={item.id}
					className="accordion-item"
					open={defaultOpen.includes(item.id)}
				>
					<summary className="accordion-summary">
						{item.title}
						<span className="accordion-chevron" aria-hidden="true">
							<Icon name="chevron" size={14} />
						</span>
					</summary>
					<div className="accordion-body text-sm fg-dim">{item.content}</div>
				</details>
			))}
		</div>
	);
}
