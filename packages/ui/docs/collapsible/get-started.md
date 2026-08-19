---
title: Get Started
summary: Render Collapsible once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Collapsible } from "@sushindustries/ui";

export function Example() {
	return (
		<Collapsible summary="What's included">
			<p>Source files, the compiled build, and a year of updates.</p>
		</Collapsible>
	);
}
```

## What you should see

One line of bold text with a chevron on the right, closed by default. It
looks identical to a single row from `Accordion` - it is the same
`<details>` markup - but there is no wrapping list around it, so it can
sit directly inside a paragraph of prose rather than inside a stacked
box.

## If nothing happens

If it opens on first paint when it should not, check `defaultOpen` was
not left set to `true` from an earlier edit - there is no way to force it
closed again after the reader has toggled it, and that is deliberate: the
prop only ever governs the very first render.
