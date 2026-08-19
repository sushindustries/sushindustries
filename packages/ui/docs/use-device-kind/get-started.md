---
title: Get Started
summary: Render useDeviceKind once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useDeviceKind } from "@sushindustries/ui";

export function DeviceReadout() {
	const kind = useDeviceKind(); // "phone" | "tablet" | "laptop" | null

	return <p>{kind ?? "not mounted yet"}</p>;
}
```

## What you should see

"not mounted yet" for the first render - including the one the server sent -
then the real machine name as soon as the effect runs and a media query
matches. Resize the window across a breakpoint and the value updates without
a reload.

## If nothing happens

The value stays `null` forever only when `window.matchMedia` is unavailable,
which in practice means a non-browser environment. In a normal browser the
usual mistake is expecting a value on the very first render - it is `null`
there by contract, on the server and on the client, so code that reads it
before the first effect has to handle that case rather than treat it as a
bug.
