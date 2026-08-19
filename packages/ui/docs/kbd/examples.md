---
title: Examples
summary: Kbd in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="kbd" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Item, Kbd } from "@sushindustries/ui";

export function ShortcutRow() {
	return (
		<div className="item">
			<span className="min-w-0">
				<span className="block font-semibold text-sm">Open search</span>
			</span>
			<span className="flex items-center gap-1 shrink-0">
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</span>
		</div>
	);
}
```

## What this example is not

This reuses the `item` class by hand rather than the `Item` component,
because `Item`'s `meta` slot is plain text and cannot hold two chips side by
side - a shortcuts list needs the row shape without the rest of `Item`'s
layout decisions.
