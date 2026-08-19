---
title: Get Started
summary: Render Dropdown Menu once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { DropdownMenu } from "@sushindustries/ui";
import "@sushindustries/atoms/atoms.css";

export function Example() {
	return (
		<DropdownMenu
			label="Actions"
			icon="terminal"
			items={[
				{ id: "open", label: "Open on the site", icon: "link" },
				{ id: "retitle", label: "Change title…", icon: "text" },
				{ id: "remove", label: "Remove…", icon: "close", destructive: true },
			]}
			onSelect={(id) => console.log(id)}
		/>
	);
}
```

## What you should see

A quiet small button with a chevron pointing right. Clicking it turns the
chevron down and opens a menu under the button's left edge, with `Remove…` in
the palette's one warm red. Clicking anywhere else closes it, Escape closes it
and puts focus back on the button, and the arrow keys walk the items.

## If nothing happens

A menu that opens centred in the middle of the viewport, full width, with a
border you did not ask for, is the user agent's own popover styling:
`@sushindustries/atoms/atoms.css` was never imported, and the resets that undo
`inset: 0` live in it. A menu that never opens at all means the browser has no
popover API, which nothing this component does can work around.
