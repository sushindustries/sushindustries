---
title: Context Menu
summary: One menu, reachable by right-click, by long press, and by a button that is always there.
---

<!-- ::start:showcase demo="context-menu" height="400" -->
<!-- ::end:showcase -->

## Three doors to the same room

Right-click is the interaction people ask for and the one fewest people can
perform. A menu that is *only* reachable that way does not exist on a phone,
does not exist for anyone navigating by keyboard, and does not exist for
someone on a trackpad who has never found secondary click.

| Door | Who uses it |
| --- | --- |
| Right-click | pointer, and it is what people expect of an icon |
| Long press, 450ms | touch and pen. `pointerType` is checked, because a held mouse button is a drag, not a long press |
| A visible button | everyone else, including every keyboard user |

The button is the important one, and it is **always visible** rather than
revealed on hover. A control that only exists while a pointer is over it does
not exist on a touch screen at all.

> [!IMPORTANT] The long press cancels on movement
> A press that turns into a drag is a scroll. Without the cancel, a menu opens
> in the face of anyone who scrolls the page with their thumb on a folder.
