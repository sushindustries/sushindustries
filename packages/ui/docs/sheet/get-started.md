---
title: Get Started
summary: Render Sheet once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Sheet } from "@sushindustries/ui";
import { useState } from "react";

export function FilterButton() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Filters
			</button>
			<Sheet open={open} onClose={() => setOpen(false)} title="Filters">
				<p>Filter controls go here.</p>
			</Sheet>
		</>
	);
}
```

## What you should see

A panel sliding in from the right edge (the default `side`), covering the
full height of the viewport, with the page behind it dimmed and unreachable -
`showModal` puts it on the top layer and traps focus inside. Escape, clicking
the dimmed backdrop, and the close button all call `onClose`.

## If nothing happens

Clicking the trigger but seeing nothing usually means `open` isn't actually
becoming `true` - check the state update, not the component. If the sheet
opens but closing does nothing, `onClose` has to update the same `open` state
that opened it; the dialog closes itself natively on Escape and backdrop
click, but if `open` stays `true` afterward, the effect reopens it on the
next render.
