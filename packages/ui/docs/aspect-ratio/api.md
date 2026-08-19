---
title: Aspect Ratio API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `ratio?` | `number` | `16 / 9` | Width over height: 16/9, 1, 4/3. |
| `children` | `ReactNode` | - |  |

<!-- /generated:api -->

## Notes

`ratio` takes any positive number, not a preset - `16 / 9`, `1`, `4 / 3`
are conventions in this codebase, not values the component checks for.
Passing a fraction the wrong way round (`9 / 16` for a landscape image)
produces a tall box rather than an error, since the component has no way
to know which orientation was intended.
