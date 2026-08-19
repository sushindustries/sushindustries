---
title: Examples
summary: Device in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="device" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Device, Dock, FolderShelf } from "@sushindustries/ui";

export function Home() {
	return (
		<Device
			title="sushindustries"
			wallpaper={<span className="desk-glow" />}
			dock={<Dock tasks={openTasks} onSearch={openSearch} />}
		>
			<FolderShelf entries={FOLDERS} label="Packages" actionsFor={actionsFor} />
		</Device>
	);
}
```

## What this example is not

Not a component that knows what a folder or a dock is. `Device` only offers
the screen, the strip, and the dock slot - `FolderShelf` and `Dock` are
separate components that happen to be the ones this site puts inside it.
