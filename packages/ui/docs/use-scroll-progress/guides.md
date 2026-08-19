---
title: Guides
summary: What finishAt actually measures, why an element needs real height under it, and what reduced motion gets instead of an animation.
---

## `finishAt` is measured from the bottom of the screen

It is a fraction of viewport height, not of the element's own height. `0.55`
means progress reaches 1 once the element's top has climbed to 55% up the
screen from the bottom - short of dead centre on purpose, because an
animation that finishes exactly as it arrives at the middle was never seen
finishing. Raise it towards 1 to have the animation complete earlier, while
the element is still lower on the screen.

## It needs room to travel in

The element itself does not need explicit height, but its scroll container
does: `progress` is computed from `getBoundingClientRect()` against
`window.innerHeight`, so a page - or a `stageRef` element - with nothing
below the fold to scroll through never produces a value past 0.

## `whenVisible` is a cost cut, not a feature

With it on (the default), an `IntersectionObserver` gates the scroll
listener so an element nobody can see is never measured. Turning it off
means `onProgress` runs on every scroll and resize regardless of where the
element is, which is only worth it if the callback needs to run before the
element is anywhere near the viewport.

## Reduced motion skips straight to finished

Under `prefers-reduced-motion: reduce`, `onProgress(1)` fires once and no
listener is ever attached. Whatever this drives ends up in its arrived
state immediately rather than a frozen mid-transition one - the preference
asks for less movement, not a broken layout.
