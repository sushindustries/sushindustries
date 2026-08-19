---
title: Get Started
summary: Render Input once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Input } from "@sushindustries/ui";

export function Example() {
	return <Input type="email" placeholder="you@example.com" />;
}
```

## What you should see

A single-line text field with a soft border and a placeholder in a fainter
color. Focus it and the border and a low-opacity accent ring appear together -
no browser-default outline. There is no label above it: `Input` draws only the
control.

## If nothing happens

`Input` forwards every native `<input>` attribute untouched, so `value`
without `onChange` renders a field the browser refuses to let you type into -
the same as any other React controlled input. If the field looks completely
unstyled (square corners, no focus ring), the `field-control` class from
`@sushindustries/atoms` did not load.
