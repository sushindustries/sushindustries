---
title: Examples
summary: useScrollProgress in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="use-scroll-progress" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

A reading-progress bar pinned to the top of a long article, driven straight
off the article element rather than off `window.scrollY`:

```tsx
import { useCallback, useRef } from "react";
import { useScrollProgress } from "@sushindustries/ui";

export function ReadingProgress({ children }: { children: React.ReactNode }) {
	const articleRef = useRef<HTMLElement>(null);
	const barRef = useRef<HTMLDivElement>(null);

	const paint = useCallback((progress: number) => {
		if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
	}, []);

	useScrollProgress(articleRef, paint, { finishAt: 0.05 });

	return (
		<>
			<div className="reading-bar" ref={barRef} />
			<article ref={articleRef}>{children}</article>
		</>
	);
}
```

`finishAt: 0.05` is deliberately near the bottom of the screen rather than
the default 0.55 - a reading bar should read 1 only once the article has
actually scrolled past, not the moment it appears.

## What this example is not

`.reading-bar` needs its own fixed positioning and `transform-origin: left`
in CSS - this hook only produces the number, it writes nothing to layout or
positioning on its own.
