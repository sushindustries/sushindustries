---
title: useDeskState
summary: Which windows are open, where they sit and what has been put away, remembered without breaking a server render.
---

<!-- ::start:showcase demo="use-desk-state" height="300" -->
<!-- ::end:showcase -->

## Two rules make it safe to render on a server

**The first render is always the empty desk**, on the server and on the client
alike. Storage is read in an effect afterwards.

Reading `localStorage` during render produces markup the server could not have
sent. React answers a mismatch by discarding the tree and rebuilding it, and on
a page of icons the cost of that is every icon briefly having no working click
handler. That has already happened here once, from a `typeof document` branch.

**None of it is required.** Where a window sits is a preference about a
decoration. If storage is full, disabled, or in a browsing mode that refuses it,
the desk is simply the one everybody else gets - so every access is wrapped and
every failure is silent. There is nothing useful to tell somebody about it.

## Paths are stored as ids

A stored desk outlives the tree it described. Components get added and renamed,
packages get removed.

Storing the entries themselves would restore a window titled after something
that is no longer there; storing ids means a path that no longer resolves is
dropped, and the window quietly does not reopen. Quiet is right - somebody
returning to the site did not ask about your refactor.

## One window per folder

Opening a folder that is already open raises it rather than stacking a second
identical window on the first. That is what people expect, and it is also what
stops an impatient double-click producing two windows.

## `toggle` is the taskbar's press

Minimised, it comes back and comes forward. Behind, it comes forward. Already in
front, it goes away.

That last case is what makes a taskbar a taskbar rather than a list of links,
and it lives here rather than in the dock because it is a decision about state.
The dock presses; the desk decides.

A minimised window keeps its position, its size and its place in the stack. It
is a flag rather than a second list, because it is the same window with
somewhere else to be.

## `raise` does nothing when it can

Raising the front-most window returns the same state object, so React does not
re-render and the `z` counter does not climb forever on repeated clicks. A
counter that only goes up is fine until it is serialised into storage on every
press.

## The API

```ts
const desk = useDeskState("my.desk");

desk.open(["components", "motion"]);
desk.navigate(id, ["components"]);
desk.move(id, x, y);
desk.resize(id, w, h);
desk.raise(id);
desk.toggle(id);         // what a taskbar press does
desk.close(id);

desk.hide(entryId);      // take an icon off the desktop
desk.restore(entryId);
desk.reset();            // put everything back
```

`ready` turns true once storage has been read. Rendered output must not depend
on it - it exists so a consumer can avoid animating a restored window into
place.

## Where this is used

`FolderShelf` holds one internally when given `rememberAs`. The home page holds
its own instead, because two things need it: the shelf draws the windows and the
dock lists them, and the place where two components meet is the component above
both.
