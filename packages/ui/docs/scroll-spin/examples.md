---
title: Examples
summary: Scroll Spin in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="scroll-spin" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { ScrollSpin } from "@sushindustries/ui";

export function Hero() {
	return (
		<div className="hero-split">
			<ScrollSpin revolutions={3} tilt={6}>
				<img src="/mark.svg" alt="" width={240} height={240} />
			</ScrollSpin>
			<div>
				<h1 className="h1">Every visible element is a component.</h1>
			</div>
		</div>
	);
}
```

## What this example is not

The site's own hero. The real one turns a three.js model through the same
scroll measurement (`useScrollTurn`) rather than a flat image - `ScrollSpin`
is the CSS-only version, for a mark that's actually an image or SVG.
