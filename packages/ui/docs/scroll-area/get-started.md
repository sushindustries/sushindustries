---
title: Get Started
summary: Render Scroll Area once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { ScrollArea } from "@sushindustries/ui";

export function ChangelogPanel() {
	return (
		<ScrollArea maxHeight="16rem">
			<ul className="flex flex-col gap-2">
				<li>v0.9 - Pagination clamps out-of-range pages.</li>
				<li>v0.8 - Sheet gained a `side` prop.</li>
				<li>v0.7 - Reveal never un-reveals.</li>
			</ul>
		</ScrollArea>
	);
}
```

## What you should see

Content clipped to `maxHeight`, scrollable inside its own box once it
overflows, with the site's thin scrollbar rather than the browser default.
Scrolling inside it doesn't move the rest of the page - the wheel is handed
back to this container and released once you reach its top or bottom.

## If nothing happens

If the inner content scrolls the whole page instead of staying contained,
something above `ScrollArea` in the tree is intercepting scroll before it
gets here - the component always sets `data-lenis-prevent` itself, so that
isn't the missing piece. If there's no scrollbar at all, the content is
probably shorter than `maxHeight`, and that's correct.
