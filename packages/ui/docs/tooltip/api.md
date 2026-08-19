---
title: Tooltip API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `label` | `string` | - | The one line. A tooltip that needs two is a hover card. |
| `children` | `ReactNode` | - |  |

<!-- /generated:api -->

## Notes

`children` takes whatever needs the label, wrapped in an inline-block span -
text, an icon, a whole button. There is no `disabled` or `open` prop: the
bubble's visibility is pure CSS, driven by `:hover` and `:focus-within` on the
wrapper, so there is no state to get out of sync with the pointer.

The bubble is not wired to `children` with `aria-describedby`. A screen
reader that announces it does so by convention on `role="tooltip"`, not
because this component built the association - if the label is information a
screen reader user must not miss, give the child its own `aria-label` too
rather than relying on the bubble alone.
