---
title: Get Started
summary: Render Smooth Scroll once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { SmoothScroll } from "@sushindustries/ui";

export function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SmoothScroll />
			{children}
		</>
	);
}
```

Mount it once, near the root of the app - it takes no props and needs no
container, because it takes over the whole document's scroll rather than a
piece of the page.

## What you should see

Nothing new in the markup - `SmoothScroll` renders `null`. What changes is
how the page feels under the wheel or a trackpad: scrolling eases in and
out instead of jumping frame to frame. Anyone with `prefers-reduced-motion:
reduce` set gets the browser's plain native scroll instead, which is
correct and not a bug to chase.

## If nothing happens

Mounting it twice is the real failure mode - two `Lenis` instances fight
over the same wheel events, and the scroll stutters rather than smooths.
If the page still feels like native scrolling and reduced motion is off,
check that the component is mounted at all; it does not warn when it is
missing, it just leaves the browser's default in place.
