---
title: Get Started
summary: Render Toggle once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { Toggle } from "@sushindustries/ui";

export function Example() {
	const [pressed, setPressed] = useState(false);

	return (
		<Toggle pressed={pressed} onPressedChange={setPressed}>
			Bold
		</Toggle>
	);
}
```

## What you should see

A button that looks pressed after a click - a slightly darker fill, a
firmer border - and stays that way until clicked again. `aria-pressed`
flips with it, so a screen reader announces the change as well.

## If nothing happens

`Toggle` has no state of its own - `pressed` is entirely the caller's, so a
click that never updates `pressed` (a missing `onPressedChange`, or one
that does not call `setState`) looks exactly like a broken button: it
fires, and nothing about it changes.
