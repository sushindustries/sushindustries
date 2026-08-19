---
title: Get Started
summary: Render useScrollTurn once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useCallback, useRef } from "react";
import { useScrollTurn, type ScrollTurn } from "@sushindustries/ui";

export function SpinningMark({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);

	const apply = useCallback(({ turn, wobble }: ScrollTurn) => {
		const node = ref.current;
		if (!node) return;
		node.style.transform = `rotateX(${wobble}deg) rotateY(${turn * 360}deg)`;
	}, []);

	useScrollTurn(apply);

	return <div ref={ref}>{children}</div>;
}
```

This is `ScrollSpin`'s own implementation - the hook alone, without the
wrapping component.

## What you should see

Nothing while the page is at the top. Scroll down two viewport heights (the
default `revolutions`) and the element completes one full rotation, with a
slight wobble on the X axis from the default `tilt`. Scroll back up and it
turns back the same way - the rotation is a direct function of `scrollY`,
never a triggered animation.

## If nothing happens

The callback must be memoised with `useCallback`. An inline arrow function
is a new value on every render, which is a dependency of the internal
effect, so the scroll listener is torn down and rebuilt constantly - on a
page that re-renders for unrelated reasons, the rotation can stall or jump.
