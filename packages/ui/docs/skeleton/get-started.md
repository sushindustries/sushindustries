---
title: Get Started
summary: Render Skeleton once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Skeleton } from "@sushindustries/ui";

export function Example() {
	return (
		<div className="flex items-center gap-3">
			<Skeleton shape="circle" />
			<Skeleton shape="line" width="60%" />
		</div>
	);
}
```

## What you should see

A soft grey shape with a light band sweeping across it every 1.4 seconds -
a circle roughly the size of an avatar, a line about a line of text tall. It
carries no text and no size unless you give it one; `aria-hidden` means a
screen reader skips straight past it, so the only way to check it worked is
to look.

## If nothing happens

Without the atoms stylesheet imported, `.skeleton` has no background, no
size and no animation - it is an empty inline `<span>` and disappears
entirely. A `block` shape with no width also collapses, because `aspect-ratio`
has nothing to size itself against inside a parent with no width of its own.
