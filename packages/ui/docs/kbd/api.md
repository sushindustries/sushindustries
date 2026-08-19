---
title: Kbd API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |

<!-- /generated:api -->

## Notes

One prop, and it is the whole content of the chip - there is no `label` or
`tone` to set separately. `children` is not restricted to a single
character; a longer string still renders, it just widens the chip rather
than wrapping.
