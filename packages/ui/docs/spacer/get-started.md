---
title: Get Started
summary: Render Spacer once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Spacer } from "@sushindustries/ui";

export function Example() {
	return (
		<>
			<p>Above.</p>
			<Spacer size={6} label="Later" />
			<p>Below.</p>
		</>
	);
}
```

## What you should see

A gap between the two paragraphs, taller than the line-height around it,
with a hairline rule and the word "Later" sitting on it, centred. Drop the
`label` and `rule` props and the gap is still there but draws nothing -
`Spacer` with neither is deliberately invisible, so if you are checking that
it worked, add a `label` first and remove it once you trust the height.

## If nothing happens

A blank `<Spacer size={5} />` with no `rule` and no `label` is meant to look
like nothing changed - it is `aria-hidden` and unstyled beyond its height.
That is correct, not a sign the install failed; the height is still there in
the layout even though there is nothing to see.
