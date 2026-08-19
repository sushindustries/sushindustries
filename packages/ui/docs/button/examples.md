---
title: Examples
summary: Button in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="button" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Button } from "@sushindustries/ui";

export function CtaRow() {
	return (
		<div className="flex gap-3">
			<Button href="/packages">Browse packages</Button>
			<Button variant="ghost" href="https://github.com/sushindustries">
				View source
			</Button>
		</div>
	);
}
```

## What this example is not

Both buttons here are links, not handlers. A form's submit button is a
different shape entirely - `<Button type="submit">` with no `href`, so it
posts the form instead of navigating - and that case belongs with the
form it submits, not repeated here on its own.
