---
title: Guides
summary: Using Smooth Scroll well, and the mistakes that look like it is broken.
---

## Mount it once, at the root

`SmoothScroll` owns the whole document's scroll the moment it mounts - there
is no scoping prop, because Lenis intercepts wheel and touch for the page,
not for a subtree. Put it once near the top of the app. A second instance
does not stack; it competes with the first for the same events.

## The scroll veil

An iframe or a canvas swallows wheel events that pass over it, so a scroll
gesture that crosses one loses its stream mid-flight - the flutter every
page full of live previews had before this existed. While a scroll is in
flight, `SmoothScroll` sets `data-scrolling` on `<html>`, and the stylesheet
turns embedded surfaces `pointer-events: none` for exactly that long:

```css
[data-scrolling] iframe,
[data-scrolling] canvas {
	pointer-events: none;
}
```

The gesture stays whole, and the previews are interactive again the instant
the page settles - about 150ms after the last scroll event.

## Opting an element out

Some elements need the browser's own scroll, not Lenis's: a table that
scrolls sideways in its own frame, a code block, a drawer. Those carry
`data-lenis-prevent`, which tells Lenis to leave that subtree alone
entirely rather than steal its wheel and touch events. `Table` sets this
attribute on its own frame for exactly this reason - drag inside a wide
table and the table scrolls, not the page behind it.
