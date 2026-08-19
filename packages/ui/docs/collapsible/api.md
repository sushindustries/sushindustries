---
title: Collapsible API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `summary` | `string` | - | The always-visible line. |
| `children` | `ReactNode` | - |  |
| `defaultOpen?` | `boolean` | - | Open on the first paint. After that the reader's toggle stands - nothing re-forces it. |

<!-- /generated:api -->

## Notes

There is no controlled mode - `defaultOpen` sets the state for the first
render only, matching `Accordion`. `summary` is plain text, not a
`ReactNode`; anything that needs markup in the always-visible line
belongs in a custom `<details>` built by hand, not through this
component.
