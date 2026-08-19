---
title: Get Started
summary: Render Consent once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { Consent } from "@sushindustries/ui";

export function Example() {
	const [open, setOpen] = useState(true);

	return (
		<Consent
			open={open}
			onAccept={() => setOpen(false)}
			onDecline={() => setOpen(false)}
		>
			I measure page views to see what is worth writing more of. Nothing
			personal, nothing sold.
		</Consent>
	);
}
```

## What you should see

A bar docked to the corner of the screen with your question and two
equal-sized buttons, Allow and Decline. It does not dim or block the rest of
the page - that is deliberate, not a missing backdrop.

## If nothing happens

`open` starting `false` renders nothing at all, which is correct once an
answer is already recorded. If the bar never appears on a fresh visit, check
that whatever reads the stored answer defaults to "ask" rather than "denied" -
this component has no memory of its own and only ever reflects `open`.
