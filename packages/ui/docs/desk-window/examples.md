---
title: Examples
summary: Desk Window in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="desk-window" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { DeskWindow } from "@sushindustries/ui";

interface OpenWindow {
	id: string;
	title: string;
	x: number;
	y: number;
	z: number;
}

export function Desk({ windows, onChange }: {
	windows: OpenWindow[];
	onChange: (next: OpenWindow[]) => void;
}) {
	const [top, setTop] = useState(windows.length);

	return (
		<div className="relative" style={{ height: 480 }}>
			{windows.map((win) => (
				<DeskWindow
					key={win.id}
					title={win.title}
					x={win.x}
					y={win.y}
					z={win.z}
					onMove={(x, y) =>
						onChange(windows.map((w) => (w.id === win.id ? { ...w, x, y } : w)))
					}
					onRaise={() => {
						const z = top + 1;
						setTop(z);
						onChange(windows.map((w) => (w.id === win.id ? { ...w, z } : w)));
					}}
					onClose={() => onChange(windows.filter((w) => w.id !== win.id))}
				>
					<p className="p-4 fg-dim m-0 text-sm">{win.title}'s contents</p>
				</DeskWindow>
			))}
		</div>
	);
}
```

## What this example is not

Not the whole desk. Deciding which windows exist, and assigning the next `z`
on raise, is left to the host - here folded into one component for brevity,
but on the real site that bookkeeping lives in its own hook (`useDeskState`)
so it can also persist to storage.
