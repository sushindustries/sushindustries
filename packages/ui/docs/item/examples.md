---
title: Examples
summary: Item in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="item" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Item } from "@sushindustries/ui";

const packages = [
	{ name: "ui", tone: "layout", summary: "The components the site is made of." },
	{ name: "atoms", tone: "content", summary: "Design tokens and atomic CSS." },
	{ name: "db", tone: "docs", summary: "Drizzle schema and client." },
] as const;

export function PackageList() {
	return (
		<ul className="flex flex-col gap-1">
			{packages.map((pkg) => (
				<li key={pkg.name}>
					<Item
						title={pkg.name}
						description={pkg.summary}
						icon="package"
						tone={pkg.tone}
						href={`/packages/${pkg.name}`}
					/>
				</li>
			))}
		</ul>
	);
}
```
