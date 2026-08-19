---
title: Examples
summary: Reveal in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="reveal" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Reveal } from "@sushindustries/ui";

export function FeatureList() {
	return (
		<ul className="flex flex-col gap-4">
			{["Fast", "Typed", "Composable"].map((label, index) => (
				<Reveal key={label} delay={index * 80}>
					<li>{label}</li>
				</Reveal>
			))}
		</ul>
	);
}
```

## What this example is not

A recipe for every list. Stagger a handful of items - three or four - the way
this example does. Past that the last one lands noticeably late, and the
delay reads as the page being slow rather than as an effect.
