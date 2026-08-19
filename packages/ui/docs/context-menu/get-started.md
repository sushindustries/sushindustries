---
title: Get Started
summary: Render Context Menu once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { ContextMenu, useContextMenu } from "@sushindustries/ui";

export function Example() {
	const menu = useContextMenu();

	return (
		<div {...menu.triggerProps}>
			<button {...menu.buttonProps} type="button" className="btn-ghost">
				Actions
			</button>

			<ContextMenu
				state={menu}
				actions={[
					{ id: "rename", label: "Rename", onSelect: () => {} },
					{ id: "delete", label: "Delete", onSelect: () => {} },
				]}
			/>
		</div>
	);
}
```

## What you should see

Right-click the trigger, long-press it on touch, or press the button, and a
menu opens at that point with your actions in it. Arrow keys move between
rows, Escape closes it, and clicking anywhere else closes it too.

## If nothing happens

`ContextMenu` portals to `document.body` and renders nothing on the server -
it needs `react-dom` available and a browser to mount into, so it will never
appear in a server-rendered snapshot. If right-click does nothing but the
button works, check that `triggerProps` landed on an element large enough to
receive the click; both hook results have to be spread onto real elements,
they do nothing on their own.
