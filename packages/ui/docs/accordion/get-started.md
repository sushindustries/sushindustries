---
title: Get Started
summary: Render Accordion once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Accordion } from "@sushindustries/ui";

const items = [
	{ id: "shipping", title: "Shipping", content: "Two to four days, tracked." },
	{ id: "returns", title: "Returns", content: "Thirty days, no questions." },
];

export function Example() {
	return <Accordion items={items} defaultOpen={["shipping"]} />;
}
```

## What you should see

Two rows stacked in a bordered box, each with a title and a chevron on the
right. "Shipping" starts open with its content visible underneath;
"Returns" starts closed. Click a summary line and only that row toggles -
the other stays exactly as it was, because each row is its own `<details>`.

## If nothing happens

Nothing toggling almost always means the click landed outside the
`<summary>` line rather than on it - the row's padding is part of the
summary, but the space between rows is not. If a row that should start
open does not, check the id in `defaultOpen` matches an item's `id`
exactly; a typo there fails silently.
