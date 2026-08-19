---
title: Collapsible API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `summary` | `ReactNode` | - | The always-visible line. A node rather than a string, so a section can put its own icon beside its name. It was a string, which forced every caller that wanted one to give up the component and hand-roll a `<details>` - which is the shape of a prop that is one type too narrow. Keep it to a line. This is a summary element: it is the click target and the thing a screen reader announces for the whole section, so a paragraph in here is a paragraph read out before anything else. |
| `children` | `ReactNode` | - |  |
| `defaultOpen?` | `boolean` | - | Open on the first paint. After that the reader's toggle stands - nothing re-forces it. |

<!-- /generated:api -->

## Notes

There is no controlled mode - `defaultOpen` sets the state for the first
render only, matching `Accordion`. `summary` is plain text, not a
`ReactNode`; anything that needs markup in the always-visible line
belongs in a custom `<details>` built by hand, not through this
component.
