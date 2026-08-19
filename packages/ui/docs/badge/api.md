---
title: Badge API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `tone?` | `string` | - | Colour family, resolved by the stylesheet. Absent is the quiet default. |

<!-- /generated:api -->

## Notes

`Badge` has no `href` or `onClick` - it is always a `<span>`. Wrapping it
in a link or a button is the caller's job, and doing so changes nothing
about the badge's own markup or styling.
