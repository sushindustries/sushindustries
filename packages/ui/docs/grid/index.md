---
title: Grid
summary: A responsive grid with no breakpoints in it. One number decides the column count at every width.
---

Four cards that become one column, without a media query anywhere.

<!-- ::start:showcase demo="grid" height="420" -->
<!-- ::end:showcase -->

## The whole mechanism

```css
grid-template-columns: repeat(auto-fit, minmax(var(--grid-min), 1fr));
```

`min` is the narrowest a column may get. Columns fit as many as will fit at that
width and share what is left, so the same grid is four across on a desktop and
one across at 320 and nobody wrote either number down.

## Why not a media query

Not brevity. A media query asks about the viewport, and a grid three levels
inside a sidebar does not care about the viewport - it cares about the width it
was given. `auto-fit` asks the right question, so the same component behaves
correctly in a place its author never saw.

That is also why this reflows correctly inside the Showcase at 320 without the
Showcase knowing anything about it.

## Where this is used

| Where | What for |
| --- | --- |
| Any `.md` on this site | the `::start:grid` block |
| `packages/ui/docs/nav-bar/index.md` | the two-up explanation of wide and narrow |
| `.nav-panel-list` | the same `auto-fit` rule, inlined, so the nav has no dependency on this |
