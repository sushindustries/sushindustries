---
title: Examples
summary: Separator in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="separator" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Separator } from "@sushindustries/ui";

export function Toolbar() {
	return (
		<div className="flex items-center gap-3">
			<button type="button">Save</button>
			<Separator orientation="vertical" decorative />
			<button type="button">Publish</button>
		</div>
	);
}
```

## What this example is not

A guarantee the line shows up on its own. This toolbar works because
`.flex.items-center` gives every child the row's own height to stretch
against - drop the separator into a row without that and it's back to
needing an explicit height, per Guides.
