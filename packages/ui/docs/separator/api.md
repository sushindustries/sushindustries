---
title: Separator API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `orientation?` | `"horizontal" \| "vertical"` | `"horizontal"` | Vertical needs a height from its container; horizontal is the default. |
| `decorative?` | `boolean` | `false` | Purely visual dividers should not be announced. |

<!-- /generated:api -->

## Notes

`decorative` changes which element renders, not just an ARIA attribute on
the same one - `true` produces a `<span aria-hidden="true">`, `false`
produces a real `<hr>`. There's no in-between where an `<hr>` is hidden from
screen readers or a `<span>` is announced; pick the element by picking the
prop.

`orientation="vertical"` depends entirely on its container providing a
height, as covered in Guides - the prop only writes the attribute the
stylesheet reads.
