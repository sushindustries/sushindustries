---
title: Sheet API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `open` | `boolean` | - | Calls `showModal`. A sheet is still modal - the page behind it cannot be reached. |
| `onClose` | `() => void` | - | Escape, the backdrop and the close button all arrive here. Clear `open` or the two disagree. |
| `title` | `string` | - |  |
| `children` | `ReactNode` | - |  |
| `side?` | `"right" \| "left"` | `"right"` | Which edge it slides from. |

<!-- /generated:api -->

## Notes

`onClose` has to actually flip `open` back to `false`. The `<dialog>` closes
itself natively on Escape and on the backdrop click this component wires up,
but the effect watching `open` calls `showModal()` again on the next render
if the prop hasn't caught up - so `open` and the dialog's own state
disagreeing is what a sheet that "won't close" usually is.

`side` only changes which edge it's docked to and which direction it
animates from; the header, the close button and the scrollable body are the
same regardless.
