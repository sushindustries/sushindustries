---
title: Guides
summary: Using Folder Shelf well, and the mistakes that look like it is broken.
---

## Dragging, in one rule

**Position is written to the element during the drag and to state only on
release.**

Sixty state updates a second would re-render a window's whole contents on every
frame, and the contents here are grids of icons. During a drag the handler
writes two custom properties; when the pointer lifts, one state update records
where it ended up.

`setPointerCapture` keeps the drag alive when the pointer outruns the title bar,
which is exactly the moment somebody is throwing a window across the screen and
most notices it break. One code path serves mouse, touch and pen, because they
are pointer events.

Resizing is the same three events against the other corner. Not `resize: both`,
which is one line of CSS and cannot be told about a minimum, cannot be clamped
to the desk, and writes to the element's inline size without telling React - so
the size is forgotten the moment anything re-renders.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## Pages open here

`renderEntry` takes a leaf and returns its page, or nothing.

Return nothing and the leaf stays a link, which is the right default - this
component has no idea what is at the other end of an href. Return something and
the desktop stops being a directory of the site and becomes where the site is.

The rule that matters is that it is all or nothing per kind of thing. A folder
where some items open in a window and others jump to another page is worse than
either, so on this site: components, packages and posts render here because
their Markdown is on hand, and the machine-readable files stay links because
the honest way to look at what a crawler fetches is to fetch it.

## Search is not in here

It used to be: a field above the icons, filtering the tree.

It came out when the dock grew a search palette, because two search boxes over
the same tree on the same screen is the duplication this repo keeps deleting
everywhere else. The dock's is better placed - centred, over a dimmed screen,
where the eye goes when you decide to search - and one of them had to go.

What is left here is the walk, exported so whoever is doing the searching can
use it:

```ts
import { flatten, matches } from "@sushindustries/ui";

flatten(entries).filter(({ entry }) => matches(entry, query));
```

`flatten` returns each entry with the path that leads to it, so a result can say
which folder it lives in - the difference between a name and an answer. And it
deliberately walks past the folders: somebody typing into a desktop is looking
for a file, not for the drawer it is in.

## The data

```ts
interface ShelfEntry {
	id: string;
	label: string;
	description?: string;
	href?: string;
	meta?: string;
	icon?: IconName;
	children?: ShelfEntry[];
}
```

`children` is the whole type system: present and non-empty makes it a folder,
absent makes it a thing. There is no `kind` field to get wrong.

## Where this is used

| Where | What |
| --- | --- |
| The home page | inside `Laptop`, with a `Dock` along the bottom |
| `apps/web/content/shelf.md` | the tree, as a nested Markdown list |
| `shelf.catalogue.ts` | expands `{components}`, `{packages}`, `{posts}`, `{files}` from the registry |
| `shelf-actions.ts` | what the right-click menu can do |
| `shelf-page.tsx` | `renderEntry`: the Markdown lookup |

`rememberAs` is a storage key, used when the shelf makes its own desk.

> [!CAUTION] Two `useDeskState` calls with one key are not one desk
> They are two React states that happen to write to the same place. Opening a
> window through one leaves the other rendering the desk it last knew about -
> which is exactly what happened when the dock's search button wrote to the
> site's desk while the shelf kept rendering its own: a task appeared in the
> dock and no window appeared on screen.
>
> Whenever something outside the shelf needs to open, close or list windows,
> hold the desk above both and pass it in as `desk`.
