---
title: useDeskState
summary: Which windows are open, where they sit and what has been put away, remembered without breaking a server render.
---

<!-- ::start:showcase demo="use-desk-state" height="300" -->
<!-- ::end:showcase -->

## Paths are stored as ids

A stored desk outlives the tree it described. Components get added and renamed,
packages get removed.

Storing the entries themselves would restore a window titled after something
that is no longer there; storing ids means a path that no longer resolves is
dropped, and the window quietly does not reopen. Quiet is right - somebody
returning to the site did not ask about your refactor.

## Where this is used

`FolderShelf` holds one internally when given `rememberAs`. The home page holds
its own instead, because two things need it: the shelf draws the windows and the
dock lists them, and the place where two components meet is the component above
both.
