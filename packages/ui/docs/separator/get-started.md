---
title: Get Started
summary: Render Separator once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Separator } from "@sushindustries/ui";

export function Menu() {
	return (
		<nav className="flex items-center gap-3">
			<a href="/docs">Docs</a>
			<Separator orientation="vertical" decorative />
			<a href="/packages">Packages</a>
		</nav>
	);
}
```

## What you should see

A thin rule between the two links. Horizontal (the default) renders as an
actual `<hr>` unless `decorative` is set, in which case it's a styled
`<span>` that screen readers skip entirely. Vertical needs a height to show
against - inside a row with no defined height it collapses to nothing
visible.

## If nothing happens

A vertical separator with no visible line almost always means its container
has no height for it to span - `align-items: stretch` on a flex row, or an
explicit height, is what gives it something to be as tall as.
