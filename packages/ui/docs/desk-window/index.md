---
title: Desk Window
summary: A window you can drag, resize, close and stack, without re-rendering its contents every frame.
---

<!-- ::start:showcase demo="desk-window" height="380" -->
<!-- ::end:showcase -->

## One rule

**Position is written to the element during the drag, and to state only on
release.**

Sixty state updates a second would re-render the window's whole contents on
every frame of every drag, and the contents of these are grids of icons. During
a drag the handler writes two custom properties straight onto the node; when the
pointer lifts, exactly one state update records where it ended up.

```css
.desk-window {
	translate: var(--win-x, 0) var(--win-y, 0);
	width: var(--w, min(30rem, calc(100% - var(--s-5))));
}
```

`var(--w, <default>)` is what lets one rule serve both a window nobody has
resized and one somebody has, with no second class.

## Where this is used

Every open folder and every page shown on the home page desktop.
`FolderShelf` owns which windows exist; this owns how one behaves.
