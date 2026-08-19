---
title: Get Started
summary: Render Reveal once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Reveal } from "@sushindustries/ui";

export function Intro() {
	return (
		<Reveal>
			<h2>Every visible element is a component.</h2>
		</Reveal>
	);
}
```

## What you should see

Nothing, until the element's scroll position brings it within about 10% of
the bottom of the viewport - then it fades and rises into place, once.
Scrolling back up doesn't hide it again; a `Reveal` that already fired stays
shown.

## If nothing happens

If content never appears at all, check that `Reveal` is actually below the
fold on first load - an element already in view when the page mounts reveals
almost immediately, since the observer fires on the first frame it can
measure. If it appears instantly with no motion, `prefers-reduced-motion` is
probably set, which is the component working as intended, not a bug.
