---
title: Get Started
summary: Render Card once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Card } from "@sushindustries/ui";

export function Example() {
	return (
		<Card title="Accordion" meta="v1.2" icon="rule" tone="motion" href="/components/accordion">
			<p>details, stacked - every row opens on its own.</p>
		</Card>
	);
}
```

## What you should see

A bordered surface with a small toned tile beside the title, "v1.2"
aligned to the top right, and the paragraph below. Because `href` is set
the whole card is a link - hovering it lifts the card and darkens its
background, and the title stays an `h3` since `as` was not passed.

## If nothing happens

A card with no image where one was expected means `image` was left
unset - there is no separate "image variant" prop; passing `image` is
what turns a card into the image card. If cards in a grid do not line up
to the same height, check they sit inside `.card-grid` or an equivalent
grid parent - `Card` itself has no opinion about its siblings.
