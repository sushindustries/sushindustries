---
title: Grid API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children?` | `ReactNode` | - |  |
| `min?` | `string` | `"16rem"` | Narrowest a column may get before the grid drops one. The whole layout, in one number. `auto-fit` plus `minmax` works out the column count from the space available, so there is no breakpoint to write and no count to keep in step with a media query. |
| `gap?` | `Space` | `4` | A step on the scale, rendered as `data-gap`. Between rows as well as columns. |
| `columns?` | `2 \| 3 \| 4` | - | Fixed column count, for the cases where content really is paired. |
| `className?` | `string` | - |  |

<!-- /generated:api -->

## Notes

`columns` and `min` are not combined - setting `columns` replaces the
`auto-fit` template outright, so `min` is written to the element either way
but goes unused while `columns` is set. A fixed count also behaves
differently below the 860px breakpoint: it collapses straight to one column,
where the `min`-driven grid has already been narrowing one column at a time
the whole way down.

A direct child can claim more than one track with `data-span="2"`,
`data-span="3"` or `data-span="full"`, regardless of which prop is set. Spans
collapse back to `auto` below 860px along with everything else, so a span can
never force a squeeze on a phone.
