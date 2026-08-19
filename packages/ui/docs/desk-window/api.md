---
title: Desk Window API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | - |  |
| `children` | `ReactNode` | - |  |
| `x` | `number` | - | Left edge in pixels within the desk. Clamped so 80px always stays reachable. |
| `y` | `number` | - | Top edge in pixels within the desk. Clamped so the title bar cannot leave it. |
| `z` | `number` | - | Stacking order, applied as `zIndex`. The desk decides which window is highest. |
| `w?` | `number` | - | Set once resized. Absent uses the CSS default. |
| `h?` | `number` | - | Set once resized, never below 160. Absent uses the CSS default. |
| `label?` | `string` | - |  |

<!-- /generated:api -->

## Notes

`onResize` doubles as the flag for whether resizing is offered at all: leave
it unset and no resize corner renders, `w` and `h` are then read from CSS
defaults, and the window can only be moved. Pass it to get both the corner
and the 240×160 minimum enforced during the drag.

`x` and `y` are clamped during the drag to keep the title bar reachable, but
that clamp is relative to the window's own parent at drag time - resizing the
parent after mounting does not retroactively pull an off-screen window back
in.
