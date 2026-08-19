---
title: Examples
summary: useDeskState in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="use-desk-state" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The home page's own shelf holds one desk and hands `open` to every icon,
whatever kind of thing it opens:

```tsx
import { useDeskState } from "@sushindustries/ui";

const DESK_KEY = "sushindustries.desk";

export function SiteShelf({ entries }: { entries: ShelfEntry[] }) {
	const desk = useDeskState(DESK_KEY);

	function open(entry: ShelfEntry, path: ShelfEntry[] = []) {
		desk.open([...path.map((step) => step.id), entry.id]);
	}

	return (
		<>
			{entries.map((entry) => (
				<button key={entry.id} type="button" onClick={() => open(entry)}>
					{entry.title}
				</button>
			))}
			{desk.desk.windows.map((win) => (
				<DeskWindow key={win.id} state={win} onClose={() => desk.close(win.id)} />
			))}
		</>
	);
}
```

## What this example is not

This does not render the windows themselves - `DeskWindow` is left as a
stand-in for whatever component draws a window from a `DeskWindowState`.
`useDeskState` only tracks which windows exist and where; drawing them,
including drag-to-move calling `desk.move`, is a separate concern.
