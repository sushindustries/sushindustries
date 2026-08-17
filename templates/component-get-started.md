<!-- template
target: packages/ui/docs/{slug}/get-started.md
tokens: slug, title
-->
---
title: Get Started
summary: Render {title} once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Something } from "@sushindustries/ui";

export function Example() {
	return <Something />;
}
```

## What you should see

Describe the result, so somebody can tell a working install from a silent one.
A component that renders nothing when it is correct needs this paragraph more
than any other component does.

## If nothing happens

The two or three things that are actually wrong when it does not work: the
tokens are not imported, the parent has no height, a prop defaults to off.
