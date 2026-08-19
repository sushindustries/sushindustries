---
title: Get Started
summary: Render Desk Window once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { DeskWindow } from "@sushindustries/ui";

export function Example() {
	const [pos, setPos] = useState({ x: 12, y: 12 });

	return (
		<div className="relative" style={{ height: 320 }}>
			<DeskWindow
				title="One window"
				x={pos.x}
				y={pos.y}
				z={1}
				onMove={(x, y) => setPos({ x, y })}
				onClose={() => {}}
				onRaise={() => {}}
			>
				<p className="p-4 fg-dim m-0 text-sm">Drag the bar.</p>
			</DeskWindow>
		</div>
	);
}
```

## What you should see

A titled box at `(x, y)` that follows the pointer while you drag its title
bar, and stops exactly where you release it. Nothing animates the drop - the
window is wherever your last frame left it.

## If nothing happens

`DeskWindow` needs a positioned ancestor - it is `position: absolute` inside
whatever contains it, so a parent with no `position: relative` (or no size at
all) lets it drift to the nearest positioned ancestor up the tree, usually
the whole page. `onMove` only fires on release, not during the drag, so a
window that visibly moves but never "commits" its position is a host that
never re-renders with the new `x`/`y` it received.
