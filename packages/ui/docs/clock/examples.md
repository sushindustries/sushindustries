---
title: Examples
summary: Clock in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="clock" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Clock } from "@sushindustries/ui";

export function SiteFooter() {
	return (
		<footer className="flex items-center justify-between gap-3">
			<span className="fg-faint text-xs">© Sushi Industries</span>
			<Clock />
		</footer>
	);
}
```

## What this example is not

Not proof the clock is indexable. A crawler that does not run JavaScript sees
only the placeholder, same as the first paint does - fine for a footer clock,
wrong for anything meant to be read as content.
