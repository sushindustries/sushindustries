---
title: Data Table API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `rows` | `readonly TRow[]` | - |  |
| `columns` | `readonly DataTableColumn<TRow>[]` | - |  |
| `sortBy?` | `string` | - | Which column to sort by first, and which way. |
| `descending?` | `boolean` | - |  |
| `empty?` | `string` | - | What to say when there are no rows. Not an error - usually a filter. |
| `label` | `string` | - | Announced to screen readers, and never drawn. |
| `density?` | `"comfortable" \| "compact"` | - | How much room each row gets. `comfortable` is a table somebody reads a few rows of. `compact` is one they scan fifty rows of, which is a genuinely different job: at fifty rows the padding is most of the height, and a table that needs two screens to show what fits on one is a table people stop scrolling. Only the padding and the line height change. The type stays the same size in both, because shrinking text to fit more of it is where a dense table stops being readable and starts being a screenshot. |
| `striped?` | `boolean` | - | Shades alternate rows. Off by default and worth turning on for wide tables specifically: banding exists to stop the eye slipping a row between the first column and the last, and a three-column table has no such distance to slip across. On a narrow table it is decoration that makes every second row look selected. |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
