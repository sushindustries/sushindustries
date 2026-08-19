---
title: Get Started
summary: Render Folder Shelf once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { FolderShelf, type ShelfEntry } from "@sushindustries/ui";

const entries: ShelfEntry[] = [
	{
		id: "components",
		label: "Components",
		children: [
			{ id: "grid", label: "Grid", href: "/packages/ui/docs/grid" },
			{ id: "icon", label: "Icon", href: "/packages/ui/docs/icon" },
		],
	},
	{ id: "readme", label: "README", href: "/README.md" },
];

export function Example() {
	return <FolderShelf entries={entries} label="Site" />;
}
```

## What you should see

A grid of folder and file icons: one folder tile named "Components", one file
tile named "README". Clicking the folder opens a window on top of the grid
showing "Grid" and "Icon" as file tiles, with a path bar reading "Components".
Clicking "README" follows its `href` directly, because it has no children and
nothing was passed to `renderEntry`.

Drag an icon and it detaches from the grid's own flow and stays where you
dropped it on reload - that is `useDeskState` writing to storage under the
default key, `sushindustries.desk`. Two shelves on the same page with no
`rememberAs` given share that key and therefore share layout, which is
usually not what you want outside a demo.

## If nothing happens

A leaf entry with neither `href` nor a `renderEntry` prop still renders - as
a link to `#`, because `renderLink` always gets called with
`entry.href ?? "#"`. Give every leaf one or the other.

The desktop grid and its windows are laid out with the `shelf` classes from
`@sushindustries/atoms`. Without that stylesheet loaded, entries still render
and are still clickable, just as unstyled boxes stacked in document order.
