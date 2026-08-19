---
title: Consent API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `open` | `boolean` | - | Render the bar. Keep it `false` once an answer has been recorded. |
| `children` | `ReactNode` | - | The question, e.g. what is measured and why. Plain content, no chrome. |
| `onAccept` | `() => void` | - | Pressed "yes". The host records the answer and starts measuring. |
| `onDecline` | `() => void` | - | Pressed "no". The host records the answer and stays dark. |
| `label?` | `string` | `"Privacy"` | Accessible name for the region and the default heading of the bar. |
| `acceptLabel?` | `string` | `"Allow"` |  |
| `declineLabel?` | `string` | `"Decline"` |  |

<!-- /generated:api -->

## Notes

`open` is the only state this component has. There is no internal "already
answered" flag - flipping `open` back to `true` after `onAccept` or
`onDecline` fired brings the bar straight back, so the host is responsible
for keeping it closed once an answer is recorded.

`acceptLabel` and `declineLabel` change the text, not the size: the
stylesheet renders both buttons at equal weight regardless of label length,
because the point of the component is that declining costs the same click as
accepting.
