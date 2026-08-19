---
title: Get Started
summary: Render Hero once, and know what you should be looking at.
---

## Use it

```tsx
import { Hero } from "@sushindustries/ui";

export function Page() {
	return (
		<Hero
			title="Field"
			summary="A label, a control, a hint that only shows up when it matters."
			actions={<a href="#install">Install</a>}
		/>
	);
}
```

## What you should see

A heading with the title, the summary paragraph under it, and the action
below that - stacked in one column until there's a `shot` or `media` prop to
put beside it, at which point the layout splits into two.

## If nothing happens

`title` is the only required prop; a `Hero` with nothing else still renders a
heading. If the second column is missing when you expected one, check
`shot` and `media` aren't both set - `shot` wins and `media` is ignored
whenever both are given.
