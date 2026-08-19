---
title: Get Started
summary: Render useDeskState once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useDeskState } from "@sushindustries/ui";

export function Desktop() {
	const desk = useDeskState("my.desk");

	return (
		<button type="button" onClick={() => desk.open(["components", "motion"])}>
			Open Motion
		</button>
	);
}
```

## What you should see

Nothing on first render - this is a hook, not a component. Click the button
and `desk.windows` gains an entry for that path; render your own window
around each one. Reload the page and the same window reopens where it was
left, because the desk was written to `localStorage` under the key you gave
it.

## If nothing happens

`desk.ready` is `false` on the very first render, on both the server and the
client, even when storage has a saved desk. That is deliberate - rendered
output must not depend on `ready` for what it shows, only for whether it
animates a restored window into place. If a window seems to vanish and
reappear a moment later, something downstream is branching on `ready`
instead of just rendering `desk.windows`.
