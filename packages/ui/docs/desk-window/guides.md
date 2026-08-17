---
title: Guides
summary: Pointer capture, the resize corner, and the small clamps that stop a window being lost or dragged by its own close button.
---

## `setPointerCapture`

Without it the drag ends the moment the pointer outruns the title bar - which is
exactly when somebody is throwing a window across the screen, and the moment
they are most likely to notice it break.

It also means one code path for mouse, touch and pen. There is no
touch-specific branch here and no library.

## Resizing is not `resize: both`

The CSS property is one line and would have been tempting. It cannot be told
about a minimum, cannot be clamped to the desk, and - the one that decides it -
writes to the element's inline size without telling React, so the size is
forgotten the moment anything re-renders.

The corner is the same three pointer events as the drag, writing the same custom
properties, committing on release. It is `aria-hidden` and not focusable:
resizing refines something that already works, so a keyboard user is missing a
nicety rather than a capability.

## Small things that are not small

The close button stops `pointerdown` from reaching the bar. Without that,
pressing close also begins dragging the window it is closing.

Dragging is clamped to the parent, so a window cannot be lost past an edge - a
window you cannot get back is one that makes somebody reset the whole desk.

`touch-action: none` on the bar, or the browser claims the drag for scrolling
before the handler sees it.

Below 620px the window fills the desk and the resize corner is hidden. There is
nowhere to drag it to, and the corner would sit under a thumb that is trying to
scroll.
