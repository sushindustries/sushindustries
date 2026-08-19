---
title: Get Started
summary: Render Kbd once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Kbd } from "@sushindustries/ui";

export function Example() {
	return (
		<p>
			Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to search.
		</p>
	);
}
```

## What you should see

Two small chips, each holding one character, in a monospace-leaning face with
a faint border and a slightly raised background - the same chip the command
palette shows for `esc`. There is no built-in "+" between them; that comes
from the surrounding text or markup, not from `Kbd` itself.

## If nothing happens

The chip look comes from the `palette-kbd` class from `@sushindustries/atoms`.
Without that stylesheet loaded, `Kbd` still renders a semantic `<kbd>`
element with your text inside, just unstyled.
