---
title: Spinner API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `size?` | `number` | `18` | Pixel size of the ring. |
| `label?` | `string` | `"Loading"` | What is being waited for. Announced, never drawn. |

<!-- /generated:api -->

## Notes

`label` is always announced, even at the default - there is no way to
render a spinner with no accessible name, because a spinning ring nobody
can hear a reason for is worse than a generic one. `size` only scales the
ring's diameter; the border stays a fixed 2px, so a very large `size` reads
as a thin ring rather than a chunky one.
