---
title: Get Started
summary: Render Spinner once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Spinner } from "@sushindustries/ui";

export function Example() {
	return <Spinner label="Loading the example" />;
}
```

## What you should see

An 18px ring, accent-coloured on one edge, turning steadily. There is no
visible text - `label` is read by a screen reader through `role="status"`
and an `sr-only` span, not printed on the page. Set `prefers-reduced-motion:
reduce` and the ring stops spinning and pulses in place instead.

## If nothing happens

A ring that sits still without pulsing, rather than turning, usually means
reduced motion is on somewhere in the chain - check the OS setting before
assuming the component is broken. A ring with no colour at all - flat grey,
no accent edge - means the atoms stylesheet did not load.
