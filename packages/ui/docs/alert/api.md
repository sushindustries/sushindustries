---
title: Alert API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `string` | - |  |
| `children?` | `ReactNode` | - |  |
| `tone?` | `"note" \| "tip" \| "caution"` | `"note"` | What kind of news this is. `note` is the calm default. |
| `live?` | `boolean` | - | Only interruptions are announced; page furniture is not. |

<!-- /generated:api -->

## Notes

TypeScript restricts `tone` to `"note" | "tip" | "caution"`, but the
runtime check is stricter still: anything that reaches the component as
neither `"tip"` nor `"caution"` renders as `note`, which only matters if
the prop is ever set from unchecked data. `children` is optional - an
alert with only a `title` renders a one-line box with no body, which is
correct for news that needs no elaboration.
