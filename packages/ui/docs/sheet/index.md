---
title: Sheet
summary: The dialog docked to an edge, for content tall enough that centring it would mean scrolling a floating box.
updated:
---

Sheet is a dialog docked to an edge instead of centred - for a list or a
filter form tall enough that centring it would mean scrolling a floating box
in the middle of the page. It is still fully modal: the page behind it stays
unreachable until it closes.

<!-- ::start:showcase demo="sheet" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

It is the same native `<dialog>` element and the same `open`, `onClose` and
`title` props as a centred dialog - only the geometry differs. `side` writes
`data-side` on the element, so choosing docked over centred is a prop, not a
second component with its own API to learn.
