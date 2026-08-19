---
title: Examples
summary: Dock in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="dock" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Clock, Dock } from "@sushindustries/ui";
import { useDeskState } from "./use-desk-state";

export function ScreenDock() {
	const { tasks, toggle, close, openSearch } = useDeskState();

	return (
		<Dock
			tasks={tasks}
			onSelectTask={toggle}
			onCloseTask={close}
			onSearch={openSearch}
			trailing={<Clock />}
		/>
	);
}
```

## What this example is not

Not proof that `Dock` remembers anything. `tasks` and the three callbacks
all come from `useDeskState` here - `Dock` itself holds no state, so a page
that skips a real desk hook and hardcodes `tasks` gets buttons that never
change what they show.
