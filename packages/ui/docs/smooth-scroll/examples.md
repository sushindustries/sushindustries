---
title: Examples
summary: Smooth Scroll in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="smooth-scroll" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { NavBar, SmoothScroll } from "@sushindustries/ui";

export function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SmoothScroll />
			<NavBar brand={<span className="mono">acme</span>} entries={[]} />
			<main>{children}</main>
		</>
	);
}
```

## What this example is not

It is not scoped to `children`, even though it is written beside them here.
Lenis takes over the whole document's scroll no matter where in the tree
`SmoothScroll` is mounted - putting it beside the layout's other chrome is
a convenience for reading the code, not a boundary the component respects.
