---
title: Get Started
summary: Render Aspect Ratio once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { AspectRatio } from "@sushindustries/ui";

export function Example() {
	return (
		<AspectRatio ratio={16 / 9}>
			<img src="/hero.jpg" alt="" />
		</AspectRatio>
	);
}
```

## What you should see

A box exactly 16:9, whatever width its parent gives it - the image inside
fills it edge to edge and crops rather than stretching, because the child
is absolutely positioned over the box. Resize the parent and the box
resizes with it, keeping the ratio, without any JavaScript running.

## If nothing happens

If the box collapses to zero height, the parent has no width to compute
from - `aspect-ratio` needs one axis to derive the other, and a parent
with `width: 0` or `display: contents` gives it nothing to work with. If
the child overflows the box instead of filling it, check it is a direct
child - the stylesheet only positions immediate children, not anything
nested deeper inside them.
