---
title: Get Started
summary: Render Typography once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Heading, Label, Lead } from "@sushindustries/ui";

export function Example() {
	return (
		<>
			<Label>Eyebrow</Label>
			<Heading as="h3" size="h2">A heading</Heading>
			<Lead>The paragraph under it.</Lead>
		</>
	);
}
```

## What you should see

Three lines, stacked: a small uppercase eyebrow in mono, a heading at the
`h2` size scale even though it rendered as an `h3` tag, and a dimmed
paragraph under it, capped to a readable measure rather than running the
full width of its container.

## If nothing happens

If everything renders at the browser's default size and weight instead of
this site's type scale, the atoms stylesheet - `--t-h1` through `--t-xs`,
`.h*`, `.label`, `.prose` - is not loaded. These components are wrappers
around that scale; they hold no font sizes of their own.
