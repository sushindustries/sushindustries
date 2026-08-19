---
title: Get Started
summary: Render Command Palette once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { CommandPalette } from "@sushindustries/ui";

const entries = [
	{ id: "button", title: "Button", href: "/components/button", group: "Components" },
	{ id: "card", title: "Card", href: "/components/card", group: "Components" },
];

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<CommandPalette
			entries={entries}
			open={open}
			onClose={() => setOpen(false)}
			onSelect={(entry) => {
				setOpen(false);
				window.location.href = entry.href;
			}}
		/>
	);
}
```

## What you should see

Nothing, until `open` is `true` - then a centred dialog with a search
field, autofocused, and both entries listed below it. Typing filters the
list by substring across title, hint and group; arrow keys move the
highlighted row, and Enter or a click calls `onSelect` with that entry.
Escape or a click on the backdrop calls `onClose`.

## If nothing happens

If the dialog never appears, check `open` actually flips to `true` -
`CommandPalette` always renders a `<dialog>` element in the DOM, but it
stays closed until the effect watching `open` calls `showModal()`.
Selecting an entry and nothing navigating means `onSelect` is set but not
actually changing the URL - the component only reports the choice, it
never routes on its own.
