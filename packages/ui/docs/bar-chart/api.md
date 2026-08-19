---
title: Bar Chart API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `rows` | `readonly BarChartDatum[]` | - |  |
| `label` | `string` | - | Announced to screen readers, and never drawn. Required, like a caption. |
| `description?` | `string` | - | One sentence for anyone who cannot see it, saying what the shape shows. A chart's alt text is the finding, not the data - "source files are two thirds of the index" rather than "a bar chart with nine bars". The table beside it is where the numbers are. |
| `direction?` | `"bar" \| "column"` | `"bar"` | `bar` runs left to right, `column` bottom to top. |
| `colorByCategory?` | `boolean` | `false` | One colour per category, cycled from the site's tones. Off by default, and that default is the honest one: colour on a single series carries no information - the axis already says which bar is which, so colouring them differently is decoration that looks like meaning. Turn it on when the categories are the subject rather than the scale, so a reader is comparing *kinds* rather than reading a ranking. That is the case for "tokens per kind" and not for "the ten most viewed pages". |
| `height?` | `number` | `220` |  |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
