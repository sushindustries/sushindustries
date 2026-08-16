---
title: Glyphs
summary: The icon set, as data. `packages/ui/src/icon.tsx` is generated from this table.
---

# Glyphs

Every icon this library draws, one row each.

This file is the source and `src/icon.tsx` is the output. `pnpm doctor`
regenerates it and fails if the two have drifted, so editing the component by
hand is a change that gets reverted rather than a change that sticks. Add a
glyph here, run `pnpm doctor --fix`, and the `IconName` union, the paths and
the component all follow.

Paths only, no other SVG element, and each one drawn inside a 24x24 box at a
1.5 stroke. A circle is written as a path like anything else. That constraint
is what keeps the generator four lines instead of an SVG parser, and it has
never yet been the reason a glyph could not be drawn.

Multiple paths per glyph go in separate backticks in the same cell.

## The set

| Name | Paths | Why this drawing |
| --- | --- | --- |
| cube | `M12 2.5 21 7v10l-9 4.5L3 17V7z` `M3 7l9 4.5L21 7` `M12 11.5v10` | An isometric cube. The 3D viewer. |
| package | `M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z` `M7.5 5.25 16.5 9.75V18` | A taped box seen from above. |
| note | `M5 3h9l5 5v13H5z` `M14 3v5h5` `M9 13h6M9 17h4` | A page with a folded corner and two lines of writing. |
| layers | `M12 3 3 8l9 5 9-5z` `M3 13.5 12 18.5l9-5` | Two stacked plates. Components, which are things on things. |
| motion | `M3 17c4-9 14-9 18 0` `M20 14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0` | An arc with a leading dot: something travelling, not something spinning. |
| grid | `M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z` | Four cells. Layout, and what the Grid component does. |
| text | `M4 6h16M4 11h12M4 16h14M4 21h8` | Ragged lines. Prose, which is what content means here. |
| book | `M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z` `M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z` | An open book. Docs. |
| rule | `M4 6h16M4 18h16` `M12 10v4` | A gap held open between two rules. The Spacer, drawn as the thing it inserts. |
| chevron | `M6 9.5 12 15l6-5.5` | Down. Rotated by CSS wherever it needs to point elsewhere. |

## Adding one

```shell
pnpm new glyph my-glyph
pnpm doctor --fix
```

The first adds a row with an empty path and tells you to draw it. The second
regenerates the component. A row with no path is reported, not silently
rendered as an empty square.

## Why not an icon package

Ten glyphs at one stroke weight is about a kilobyte. An icon package is a
dependency, a build step and a tree-shaking question, and the thing you
actually wanted was ten shapes.

`currentColor` and no `fill` mean every glyph inherits whatever the label
beside it is doing, including its hover and focus states. That is the part a
sprite sheet gets wrong.

The set is deliberately closed and small. Every registry category has exactly
one glyph, so a category cannot be added without deciding what it looks like,
and a category with no icon in a menu that shows icons is a hole rather than a
default.
