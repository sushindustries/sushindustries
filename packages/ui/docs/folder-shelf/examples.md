---
title: Examples
summary: Folder Shelf in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="folder-shelf" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { DEVICES, FolderShelf, useDeviceKind, type ShelfEntry } from "@sushindustries/ui";

const entries: ShelfEntry[] = [
	{
		id: "packages",
		label: "Packages",
		children: [
			{ id: "ui", label: "ui", href: "/packages/ui" },
			{ id: "atoms", label: "atoms", href: "/packages/atoms" },
			{ id: "db", label: "db", href: "/packages/db" },
		],
	},
];

// The narrowest machine, so the server render and the first client frame
// agree - `useDeviceKind` is null until mounted.
function columnsFor(kind: ReturnType<typeof useDeviceKind>): number {
	return DEVICES.find((device) => device.kind === kind)?.columns ?? DEVICES[0].columns;
}

export function PackagesDesk() {
	const columns = columnsFor(useDeviceKind());

	return (
		<main className="container section">
			<FolderShelf
				entries={entries}
				label="Packages"
				columns={columns}
				rememberAs="sushindustries.packages-desk"
			/>
		</main>
	);
}
```

## What this example is not

The `columnsFor` helper is the same lookup the site's own desktop does
against `DEVICES` - the table the stylesheet's breakpoints are compiled from
- so the icon grid agrees with the CSS about how many columns are on screen.
A hardcoded number would still render, just not in step with it. `rememberAs`
is given its own key because this shelf is not the site's main desktop -
sharing the default key would mix its window state into the one on the home
page.
