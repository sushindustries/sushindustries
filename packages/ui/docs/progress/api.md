---
title: Progress API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `value?` | `number` | - | 0 to `max`. Omit for the indeterminate sweep. |
| `max?` | `number` | `100` | A full bar. The default means `value` can be a percentage with no conversion. |
| `label` | `string` | - | What is progressing. Announced with the number. |

<!-- /generated:api -->

## Notes

`max` only matters relative to `value` - it changes what fraction the bar
fills, not what's displayed as text. There's no built-in "42 of 50" label;
`label` is announced alongside the native percentage a screen reader computes
from `value` and `max` on its own.

Omitting `value` is the only way to get the indeterminate state - passing
`0` still renders a real, empty bar, and reads differently to assistive tech
than "not yet known."
