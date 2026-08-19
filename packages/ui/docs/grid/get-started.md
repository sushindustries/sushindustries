---
title: Get Started
summary: Render Grid once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Grid } from "@sushindustries/ui";

export function Example() {
	return (
		<Grid min="14rem" gap={4}>
			<div className="card p-4">One</div>
			<div className="card p-4">Two</div>
			<div className="card p-4">Three</div>
		</Grid>
	);
}
```

## What you should see

Three boxes side by side, each at least 14rem wide, sharing whatever space is
left over. Narrow the window and they wrap - two per row, then one - without a
visible jump at a fixed width, because `auto-fit` recomputes the count from
whatever space `Grid`'s own container has, not from the viewport.

## If nothing happens

`grid-auto`, the class this component writes, comes from
`@sushindustries/atoms`. Without that stylesheet loaded, the children still
render, just stacked in document order rather than gridded - `Grid` sets no
inline layout styles beyond the `--grid-min` custom property.
