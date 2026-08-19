---
title: Get Started
summary: Render Badge once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Badge } from "@sushindustries/ui";

export function Example() {
	return <Badge tone="motion">Motion</Badge>;
}
```

## What you should see

A small pill of mono text, filled with the `motion` tone's pastel and a
matching ink colour, with no border. Drop `tone` and the same pill
renders instead with a neutral outline and dim text - the quiet default
for a label that is not a category.

## If nothing happens

A badge that renders as plain text with no pill shape usually means the
atoms stylesheet is not imported - `Badge` carries no styles of its own,
only the `badge` class name. An unrecognised `tone` value is not an
error; it simply matches no rule in the stylesheet and falls back to the
untoned look.
