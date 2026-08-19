---
title: Examples
summary: Credit in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="credit" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Credit } from "@sushindustries/ui";

const DEPENDENCIES = [
	{
		name: "TanStack Start",
		by: "Tanner Linsley and contributors",
		href: "https://tanstack.com/start",
		role: "The framework this site runs on",
	},
	{
		name: "Vite",
		by: "Evan You and contributors",
		href: "https://vitejs.dev",
		role: "The build behind it",
	},
];

export function BuiltWith() {
	return (
		<div className="card-grid">
			{DEPENDENCIES.map((dep) => (
				<Credit key={dep.href} {...dep} />
			))}
		</div>
	);
}
```

## What this example is not

Not an exhaustive dependency list. A real "built with" page names every
credited package this way, one card each - spreading an object is a
convenience for the list, not a hint that the props are optional.
