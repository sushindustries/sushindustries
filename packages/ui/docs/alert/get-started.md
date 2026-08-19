---
title: Get Started
summary: Render Alert once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Alert } from "@sushindustries/ui";

export function Example() {
	return (
		<Alert title="Draft saved" tone="tip">
			Changes are kept locally until you publish.
		</Alert>
	);
}
```

## What you should see

A left-bordered box with an uppercase title line and, underneath it, the
body text. The border colour follows `tone`: the default `note` is the
calm one, `tip` and `caution` change only the accent stripe on the left
edge - the box stays quiet by design, not a coloured panel.

## If nothing happens

If the box renders with no colour on the left edge, check `tone` is one
of `note`, `tip` or `caution` - anything else falls back to `note`. An
alert that should interrupt but reads silently to a screen reader is
missing `live`; without it the box is announced only if the reader
happens to land on it.
