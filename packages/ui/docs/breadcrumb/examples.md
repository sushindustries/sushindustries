---
title: Examples
summary: Breadcrumb in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="breadcrumb" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Breadcrumb, Hero } from "@sushindustries/ui";

export function ComponentPage({ name }: { name: string }) {
	return (
		<Hero
			trail={
				<Breadcrumb
					items={[
						{ label: "Components", href: "/components" },
						{ label: name },
					]}
					origin="https://sushindustries.com"
				/>
			}
			title={name}
		/>
	);
}
```

## What this example is not

`Breadcrumb` sits inside `Hero`'s `trail` slot here, which is where every
element page on this site puts it - the component itself has no opinion
about placement and renders the same trail whether it sits above a hero,
above an article, or on its own.
