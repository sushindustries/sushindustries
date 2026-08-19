---
title: Get Started
summary: Render Slider once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Slider } from "@sushindustries/ui";

export function Example() {
	return <Slider label="Volume" min={0} max={100} defaultValue={35} />;
}
```

## What you should see

The label above a track filled in the accent color from the left edge up to
the thumb. Drag it, click anywhere on the track, or focus it and press an
arrow key or Page Up/Down - all of that is the native `<input type="range">`
doing what it already does, not code this component adds.

## If nothing happens

A track and thumb in flat grey rather than the accent color means the atoms
stylesheet is not loaded - `accent-color` is the only styling this component
applies. Passing `value` without `onChange` gives you a range the browser
will not let anyone move; use `defaultValue` for an uncontrolled slider.
