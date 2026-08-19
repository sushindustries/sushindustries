---
title: Examples
summary: Scroll Area in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="scroll-area" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { ScrollArea } from "@sushindustries/ui";

interface Item {
	id: string;
	label: string;
}

export function OrderSummary({ items }: { items: readonly Item[] }) {
	return (
		<div className="card p-4">
			<h3 className="h4 m-0">Your order</h3>
			<div className="mt-3">
				<ScrollArea maxHeight="12rem">
					<ul className="flex flex-col gap-2">
						{items.map((item) => (
							<li key={item.id}>{item.label}</li>
						))}
					</ul>
				</ScrollArea>
			</div>
		</div>
	);
}
```

## What this example is not

Sized for any list length. `maxHeight="12rem"` is a fixed choice for this
card; a list expected to run to hundreds of items wants a real virtualised
list inside the area, not just a scrollbar on top of all of them at once.
