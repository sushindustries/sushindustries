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

## When to pin the count

```tsx
<Grid columns={2}>
```

For content that is genuinely paired. A before and an after that reflow to one
column stop being a comparison, so a pinned grid holds until the narrow
breakpoint and then gives up all at once rather than degrading through an
awkward middle.

If you find yourself pinning the count for anything else, `min` is the thing you
actually wanted.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## In Markdown

```text
<!-- ::start:grid min="18rem" gap="4" -->

Anything at all, including other blocks.

<!-- ::end:grid -->
```

This exists because Markdown gives an author no way to say "these things go
side by side". Without it the workaround is an HTML table, which then has to be
undone at every width.

## Where this is used

| Where | What for |
| --- | --- |
| Any `.md` on this site | the `::start:grid` block |
| `packages/ui/docs/nav-bar/index.md` | the two-up explanation of wide and narrow |
| `.nav-panel-list` | the same `auto-fit` rule, inlined, so the nav has no dependency on this |

## Spacing

`gap` is a step on the scale, not a pixel value. There is no arbitrary-value
syntax here and that is deliberate: a short scale is what makes a set of
sections look measured rather than assembled.
