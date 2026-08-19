---
title: Get Started
summary: Render Device once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Device } from "@sushindustries/ui";

export function Example() {
	return (
		<Device title="a machine">
			<p className="p-4 fg-dim m-0 text-sm">The desktop goes here.</p>
		</Device>
	);
}
```

## What you should see

A phone, a tablet or a laptop drawn in 3D, tilted as if you were looking at
it rather than photographing it flat on. Which one you get depends on the
width of the window this page is open in - resize the browser and it changes
at 720px and 1080px, with no flash and no flicker while it does.

## If nothing happens

All three machines are always in the DOM; the stylesheet just hides the ones
that do not apply at the current width. If nothing ever changes as you
resize, the atoms stylesheet is not loaded - this component draws nothing on
its own, `devices.css` is what decides which machine shows. Content passed as
`children` is a real scroll container, so if it looks cut off, give it
content tall enough to actually scroll rather than assuming the frame is
broken.
