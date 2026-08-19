---
title: Examples
summary: Card in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="card" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Card } from "@sushindustries/ui";
import { components } from "./components.catalogue";

export function ComponentGrid() {
	return (
		<div className="card-grid">
			{components.map((component) => (
				<Card
					key={component.slug}
					title={component.name}
					icon={component.icon}
					tone={component.category}
					href={`/components/${component.slug}`}
				>
					<p className="fg-dim text-sm">{component.summary}</p>
				</Card>
			))}
		</div>
	);
}
```

## What this example is not

`.card-grid` is what makes the columns line up here - dropping the
individual `Card` elements into a plain `<div>` still renders each one
correctly, but they will not form the even grid this example shows.
