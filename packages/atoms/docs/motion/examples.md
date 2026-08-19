---
title: Examples
summary: Motion in something real, doing the job it was written for.
---

`Reveal` is what actually flips `data-reveal` from `"out"` to `"in"` - the
attribute this page describes is inert on its own, and this is it wired up:

<!-- ::start:showcase demo="reveal" height="380" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Reveal } from "@sushindustries/ui";

export function FeatureSection() {
	return (
		<Reveal>
			<h2>A section that arrives once, on the way past</h2>
			<p>Not scenery repeated on every scroll back up the page.</p>
		</Reveal>
	);
}
```

`Reveal` sets `data-reveal="out"` before it has intersected the viewport and
flips it to `"in"` the first time it does, never back - the CSS in this
package only knows how to animate between the two states, not when to
switch.

## What this example is not

The 700ms duration and the 18px rise are the token's numbers, not
`Reveal`'s - changing how this looks means editing `scroll-reveal.css`,
not passing a prop, because there is no prop for it. This is scenery, timed
the same everywhere on purpose.
