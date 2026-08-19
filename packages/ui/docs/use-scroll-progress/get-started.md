---
title: Get Started
summary: Render useScrollProgress once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useRef, useCallback } from "react";
import { useScrollProgress } from "@sushindustries/ui";

export function ProgressBar() {
	const stageRef = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);

	const show = useCallback((progress: number) => {
		if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
	}, []);

	useScrollProgress(stageRef, show);

	return (
		<div ref={stageRef} style={{ minHeight: "200vh" }}>
			<div ref={barRef} style={{ height: 6, background: "var(--fg)" }} />
		</div>
	);
}
```

## What you should see

Nothing until you scroll - the hook itself renders no markup. As the tall
`stageRef` element rises up the viewport, `show` fires roughly once per
frame, and the bar's `scaleX` climbs from 0 to 1 by the time the element's
top reaches 55% up the screen (the default `finishAt`). Scroll back down and
it reverses smoothly, because `progress` is a direct read of position, not a
one-shot trigger.

## If nothing happens

The most common cause is `stageRef` never attaching to anything tall enough
to scroll - a zero-height element never crosses the viewport, so `progress`
never leaves 0. The other is `whenVisible` doing exactly what it is meant to:
while the element is off screen the IntersectionObserver is not gating
`true`, so the scroll listener never runs and `onProgress` is never called
until it comes into view.
