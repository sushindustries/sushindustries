---
title: Device
summary: A phone, a tablet or a laptop in CSS 3D, chosen by the stylesheet rather than by JavaScript, with a real screen in it.
---

The home page is inside one of these. Which one depends on the window you are
reading this in.

<!-- ::start:showcase demo="device" height="560" -->
<!-- ::end:showcase -->

## The machine is chosen by CSS

This is the decision everything else follows from, so it is worth stating on
its own.

**Nothing in this component measures anything.** It renders one screen and
every piece of chrome all three machines could need, and the stylesheet hides
what does not apply. A phone below 720px, a tablet from 720, a laptop from
1080.

The obvious alternative is to read the width and return one of three trees, and
it is wrong in three separate ways:

| What goes wrong | Why |
| --- | --- |
| Nothing renders on the server | There is no window to measure, so SSR emits whichever branch the fallback picked. |
| The first client frame is wrong | The correction happens after hydration, which is a visible flash of the wrong machine. |
| React throws the tree away | If the server guessed and the client disagrees, that is a hydration mismatch, and the recovery is a full client re-render with dead event handlers on the way. |

All three had already happened in this repo, on other components, for exactly
this reason. Four empty `<div>`s and a `display: none` cost less than any of
them, and are correct before a byte of JavaScript arrives.

> [!NOTE] The numbers are a table
> Widths, aspect ratios, bezels, corner radii, tilt and which chrome each
> machine shows all live in `packages/atoms/devices.md`. `pnpm run doctor`
> compiles it to `devices.css` and `device-kinds.ts`. Editing either output is
> a change that gets reverted.
