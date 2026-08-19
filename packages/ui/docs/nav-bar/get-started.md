---
title: Get Started
summary: Render Nav Bar once, and know what you should be looking at.
---

## Use it

```tsx
import { NavBar } from "@sushindustries/ui";

export function SiteHeader() {
	return (
		<NavBar
			brand={<span>My Site</span>}
			entries={[
				{ id: "work", label: "Work", href: "/work" },
				{ id: "about", label: "About", href: "/about" },
			]}
		/>
	);
}
```

## What you should see

A row with the brand at the left and the entries after it, each a plain
link. An entry given `items` instead of an `href` becomes a button that
opens a panel below it on click - nothing to configure separately.

## If nothing happens

Links render as plain anchors until `renderLink` is passed, so every
navigation is a full page load by default. That is correct without a
router; pass `renderLink` once a client-side router should own the click.
