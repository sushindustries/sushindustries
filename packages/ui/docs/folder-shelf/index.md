---
title: Folder Shelf
summary: A desktop of folders that open into draggable windows, several at once, remembered between visits.
---

The desktop on the home page is this, fed by a Markdown file.

<!-- ::start:showcase demo="folder-shelf" height="520" -->
<!-- ::end:showcase -->

## What it is made of

<!-- ::start:grid min="15rem" gap="4" -->

**`FolderShelf`** is the desktop and the window manager: the icons, and which
windows exist.

**`DeskWindow`** is one window - dragging, resizing, closing, stacking.

**`useDeskState`** is where the arrangement lives, and the only part that
touches storage.

**`ContextMenu`** is the menu on every icon, reachable three ways.

<!-- ::end:grid -->

Four pieces rather than one, because three of them are useful on their own and
the fourth is only interesting when it has somewhere to put things.

## It stopped being a `<dialog>`

The first version opened folders with `showModal()`, which is genuinely the
better answer for a modal on a page: focus trapping, Escape, inertness behind
it and top-layer stacking, all free.

It is the wrong answer for a desktop. A modal dialog goes to the top layer *by
definition*, so it covered the browser window rather than the screen it belongs
to, and only one could ever be open. Windows are absolutely positioned panels
now; Escape and focus are done by hand, and the stacking is a `z` each window
carries - which is also what makes front-to-back survive a reload.

> [!NOTE] The portal went with it
> Positioning them inside the desk removed the portal, and with it a whole
> class of bug: a hydration mismatch from a `typeof document` branch, and
> `position: fixed` measuring against a rotated laptop lid instead of the
> viewport. Both had already happened.
