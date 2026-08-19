---
title: Get Started
summary: Render Textarea once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Textarea } from "@sushindustries/ui";

export function Example() {
	return <Textarea placeholder="Say what happened, in order." />;
}
```

## What you should see

A field styled exactly like `Input`, four rows tall by default. Where the
browser supports `field-sizing: content`, typing past the bottom grows the
box instead of scrolling it - the field gets taller, the page does not
scroll inside it. There is a drag handle in the corner either way, because
`resize: vertical` stays on regardless.

## If nothing happens

If the field never grows past its starting height no matter how much is
typed, the browser does not support `field-sizing: content` yet - Safari is
the notable holdout. That is a graceful fallback, not a bug: the field
keeps its fixed height and its resize handle, the same as any plain
`<textarea>`.
