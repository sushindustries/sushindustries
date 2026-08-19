---
title: Get Started
summary: Render Item once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Item } from "@sushindustries/ui";

export function Example() {
	return (
		<Item
			title="Grid"
			description="A responsive grid with no breakpoints in it."
			meta="ui"
			icon="grid"
			tone="layout"
			href="/packages/ui/docs/grid"
		/>
	);
}
```

## What you should see

One row: a small toned tile with the grid glyph on the left, the title in
bold above a fainter description line, and "ui" right-aligned. The whole row
is a link, because `href` was given - drop it and the same row renders as a
plain `<div>` instead.

## If nothing happens

`tone` does nothing without `icon` - the tile, and the only thing `tone`
colors, is not rendered at all when `icon` is left unset. If the row shows
text but no tile where you expected one, check `icon` is set first.
