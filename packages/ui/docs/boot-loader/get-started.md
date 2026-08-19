---
title: Get Started
summary: Render Boot Loader once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { BootLoader } from "@sushindustries/ui";

export function Example() {
	const [ready, setReady] = useState(false);

	return (
		<div className="device-screen" style={{ position: "relative" }}>
			<BootLoader ready={ready} onDone={() => console.log("revealed")}>
				<SpinningMark />
			</BootLoader>
		</div>
	);
}
```

## What you should see

A number climbing from 000, easing quickly at first and slowing as it
nears 90 - it stalls there and waits. Once `ready` flips to `true` it
finishes the run to 100, holds for a beat, then the whole component
unmounts and `onDone` fires. The rail underneath tracks the same number
as a length, not a second animation.

## If nothing happens

If the counter never appears, check the parent has `position: relative` -
`BootLoader` is `position: absolute; inset: 0` and needs a positioned
ancestor to fill, which is why it pairs with `.device-screen` rather than
the page body. If it reaches 90 and never finishes, `ready` never flipped
to `true` - that is not a bug, it is the component refusing to claim work
is done that has not arrived.
