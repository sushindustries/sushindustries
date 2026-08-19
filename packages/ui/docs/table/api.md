---
title: Table API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `columns` | `readonly TableColumn<Row>[]` | - | Header and renderer per column, in display order. `key` has to be unique across them. |
| `rows` | `readonly Row[]` | - | Rendered in the order given - sorting belongs to the page. Empty leaves the headers standing. |
| `rowKey` | `(row: Row) => string` | - | Stable id per row. |
| `caption?` | `string` | - | Announced description of what the table holds. |

<!-- /generated:api -->

## Notes

`caption` is always visually hidden (`sr-only`) - it exists for a screen
reader to announce what the table holds, not as a heading. A visible title
above the table is markup the caller adds outside the component; `caption`
does not double as one. `Row` is a generic inferred from `columns` and
`rows` together, so `render` and `rowKey` get real types on `row` with no
casting - as long as `columns` and `rows` agree on the same shape.
