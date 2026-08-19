---
title: Get Started
summary: Render Switch once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Switch } from "@sushindustries/ui";

export function Example() {
	return <Switch label="Smooth scrolling" defaultChecked />;
}
```

## What you should see

A pill-shaped track with a round thumb, the label text to its right, both
inside one clickable label. Checked, the track fills with the accent color
and the thumb slides to the right edge. Click anywhere on the row, or tab to
it and press Space - it is a real checkbox underneath, so both already work.

## If nothing happens

Passing `checked` without `onChange` makes it a read-only input - the thumb
never moves, clicks do nothing, and React logs a warning in the console.
Use `defaultChecked` for an uncontrolled switch, or pair `checked` with
`onChange` for a controlled one.
