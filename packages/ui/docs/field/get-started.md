---
title: Get Started
summary: Render Field once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Field, Input } from "@sushindustries/ui";

export function Example() {
	return (
		<Field label="Email" hint="Only for the reply.">
			<Input type="email" placeholder="you@example.com" />
		</Field>
	);
}
```

## What you should see

A label above a control, with a small line of hint text underneath. Click
the label text itself, not just the input - it focuses the control, because
the control is nested inside the `<label>` rather than connected to it by an
id.

## If nothing happens

Clicking the label without focusing the control usually means the control
passed as `children` is not a real focusable form element - a `<div>`
standing in for an input has nothing for the native label association to
focus. Setting `error` replaces the hint text with the error message; the two
never show together.
