---
title: Dialog API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `open` | `boolean` | - | Calls `showModal`, so the page behind goes inert while it is true. |
| `onClose` | `() => void` | - | Escape, the backdrop and the close button all arrive here. Clear `open` or the two disagree. |
| `title` | `string` | - |  |
| `children` | `ReactNode` | - |  |
| `footer?` | `ReactNode` | - | Usually a Button row. |

<!-- /generated:api -->

## Notes

`onClose` is called, never assumed - clicking the backdrop, pressing Escape
and pressing the close button all route through it, and none of them touch
`open` directly. Keeping `open` in sync with `onClose` is the caller's job;
see Guides for what happens when it is not.

`footer` is optional and, when absent, leaves no empty row behind - there is
no placeholder bar rendered for a dialog with nothing to put in one.
