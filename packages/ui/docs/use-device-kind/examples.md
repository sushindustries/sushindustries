---
title: Examples
summary: useDeviceKind in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="use-device-kind" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The desktop shelf on this site's home page needs a column count as a number,
not as CSS, because snapping a dropped icon to a cell is arithmetic:

```tsx
import { DEVICES, useDeviceKind } from "@sushindustries/ui";

function deviceColumns(kind: ReturnType<typeof useDeviceKind>): number {
	const found = DEVICES.find((device) => device.kind === kind);
	return found ? found.columns : DEVICES[0].columns;
}

export function IconGrid() {
	const columns = deviceColumns(useDeviceKind());
	return <div style={{ "--columns": columns } as React.CSSProperties}>...</div>;
}
```

`kind` is `null` on the very first call, and `DEVICES[0]` - the narrowest
machine - is the fallback: three columns fits everywhere, where guessing the
laptop's seven would pack icons into a grid too narrow for them on the first
paint of every phone that loads the page.

## What this example is not

This is not the pattern for deciding what to render. It only ever feeds a
number into layout math that already runs after mount; the grid itself is
present in the DOM from the server render regardless of `kind`.
