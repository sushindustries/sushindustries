---
title: Accordion API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `items` | `readonly AccordionItem[]` | - | Rendered in order and keyed by `id`. Each opens without closing the others. |
| `defaultOpen?` | `readonly string[]` | `[]` | Ids open on first render. |

<!-- /generated:api -->

## Notes

`defaultOpen` only affects the first render - there is no controlled
mode, so an id added to the array after mount does not force that row
open; each `<details>` owns its own open state from then on. An id in
`defaultOpen` with no matching item in `items` is silently ignored.
