---
title: Examples
summary: Grid in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="grid" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Grid, Icon } from "@sushindustries/ui";
import type { IconName } from "@sushindustries/ui";

const features: { icon: IconName; label: string }[] = [
	{ icon: "layers", label: "Components" },
	{ icon: "grid", label: "Layout" },
	{ icon: "book", label: "Docs" },
];

export function FeatureGrid() {
	return (
		<Grid min="16rem" gap={5} className="section">
			{features.map((feature) => (
				<div key={feature.label} className="card p-5">
					<Icon name={feature.icon} size={24} />
					<p className="mt-3 font-semibold">{feature.label}</p>
				</div>
			))}
		</Grid>
	);
}
```

## What this example is not

The card markup (`.card`, spacing utilities) is this site's own atoms, not
part of `Grid` - the component only lays its children out, it does not style
them. Nothing here claims a `data-span`, so every card is one track wide; a
hero card spanning the full row would set `data-span="full"` on itself.
