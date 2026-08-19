---
title: Examples
summary: Skeleton in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="skeleton" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

A card grid before its data has arrived, shaped like the cards it is about
to become - same avatar circle, same two lines, same gap - so nothing jumps
when the real content lands.

```tsx
import { Skeleton } from "@sushindustries/ui";

export function PackageGridLoading() {
	return (
		<div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
			{Array.from({ length: 6 }, (_, index) => (
				<div key={index} className="card p-4 flex flex-col gap-3">
					<Skeleton shape="circle" />
					<Skeleton shape="line" width="80%" />
					<Skeleton shape="line" width="50%" />
				</div>
			))}
		</div>
	);
}
```

## What this example is not

The count and shape here match one specific grid. A real loading state should
mirror whatever it is standing in for - matching card count is a guess made
easier, not a rule the component enforces.
