---
title: Examples
summary: Tooltip in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="tooltip" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

An icon-only button is the case this exists for - the icon alone tells a
sighted mouse user nothing about what it does:

```tsx
import { Icon, Tooltip } from "@sushindustries/ui";

export function CardActions() {
	return (
		<div className="flex gap-2">
			<Tooltip label="Copy to clipboard">
				<button type="button" aria-label="Copy to clipboard">
					<Icon name="copy" size={16} />
				</button>
			</Tooltip>
			<Tooltip label="Open in a new tab">
				<button type="button" aria-label="Open in a new tab">
					<Icon name="expand" size={16} />
				</button>
			</Tooltip>
		</div>
	);
}
```

## What this example is not

The `aria-label` on each button is doing the real accessibility work here,
not the tooltip. The bubble is a sighted-hover convenience; a screen reader
user gets the button's name from `aria-label` regardless of whether they ever
trigger the tooltip at all.
