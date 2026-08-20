---
title: Examples
summary: Product Variants in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="product-variants" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Something } from "@sushindustries/ui";

export function Page() {
	return (
		<main className="container section">
			<Something />
		</main>
	);
}
```

## What this example is not

Whatever the example quietly assumes: a fixed height, a parent that scrolls, a
route that exists. Say it, so nobody copies the example and gets the assumption
without it.
