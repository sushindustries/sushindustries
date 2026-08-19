---
title: Dock API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `tasks?` | `readonly DockTask[]` | `[]` | What is open. One button each; pressing one brings it to the front. |
| `label?` | `string` | `"Search"` | Text on the search control. |
| `trailing?` | `ReactNode` | - | Right-hand side. A count, a clock, a link. |

<!-- /generated:api -->

## Notes

`onSearch` is the flag for the search well, the same way `onCloseTask` is the
flag for the per-task close button: leave either unset and that control does
not render, rather than rendering disabled. `label` only has an effect when
`onSearch` is set - it is the accessible name and tooltip for a control that
does not exist otherwise.

`tasks` with no entries renders an empty row rather than nothing, since the
search well and `trailing` may still have something to show.
