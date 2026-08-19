---
title: Command Palette
summary: Search over everything the host can name, in a native dialog: substring filter, arrow keys, and the host keeps the router.
updated:
---

Command Palette is a search dialog over anything the host can name: type to
filter by substring, use arrow keys to move the selection, and press Enter to
choose. It wraps a native `<dialog>`, so focus trapping, Escape and the top
layer come from the browser, not from this code.

<!-- ::start:showcase demo="command-palette" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

A native `<dialog>` does the heavy lifting - `showModal` gives focus trapping,
Escape-to-close and a real top layer, none of which need reimplementing. What
this adds is the part dialogs do not have: a filter over everything the host
can name, and arrow-key selection over the result. Matching is plain substring
rather than fuzzy, because a palette whose first hit reorders as you type is
slower to use than one that is merely literal. The host owns the data and the
navigation - entries come in as props, the choice goes out through `onSelect`
- which is what keeps this installable in a project with any router.
