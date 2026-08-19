---
title: Examples
summary: Hero in something real, at every width it has to survive.
---

<!-- ::start:showcase demo="hero" height="420" -->
<!-- ::end:showcase -->

Press Compare. A hero is the largest thing above the fold on most pages it
sits on, so it is worth checking it does not overflow at 320.

## In a page

```tsx
import { Hero, Breadcrumb } from "@sushindustries/ui";

export function ComponentPage() {
	return (
		<Hero
			variant="doc"
			trail={<Breadcrumb items={[{ label: "Components", href: "/components" }]} />}
			name="hero"
			title="Hero"
			version="0.1.0"
			summary="The top of a documentation page, as one component."
		/>
	);
}
```

## What this example is not

The demo shows `Hero` on its own, at the width the showcase frame gives it.
On a real page it sits inside `apps/web`'s document layout, which is what
actually constrains its max width - `Hero` itself has no opinion on that.
