---
title: Get Started
summary: Render Workbench once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Workbench } from "@sushindustries/ui";
import "@sushindustries/atoms/atoms.css";

export function Example() {
	return (
		<Workbench title="documents" maxHeight="20rem">
			<p>Only the body is required. Every strip around it is optional.</p>
		</Workbench>
	);
}
```

## What you should see

A case in its own material with a screen sunk into it, and a centred
monospaced `DOCUMENTS` in the strip along the top. Nothing scrolls yet:
`maxHeight` is a cap rather than a height, so the body stays as tall as its
content until the content is taller than that.

## If nothing happens

A plain block with the title as ordinary text means
`@sushindustries/atoms/atoms.css` was never imported - this component ships
class names and no styles of its own, so without the stylesheet there is no
case, no screen and no strip. If the page scrolls instead of the body,
`maxHeight` was left off, and there is nothing for the body to scroll against.
