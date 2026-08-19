---
title: Skeleton API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `shape?` | `"line" \| "block" \| "circle"` | `"line"` | Shape of the thing being waited for. |
| `width?` | `string` | - | CSS size overrides; the shapes carry sensible defaults. |
| `height?` | `string` | - | Any CSS length. Overrides the shape - a taller `line` is one thick bar, not two. |

<!-- /generated:api -->

## Notes

`width` and `height` are plain inline styles, applied after the shape's own
CSS - they win regardless of `shape`, including on `circle`, where passing
only one of the two stretches it into an ellipse rather than keeping it
round. There is no prop for the shimmer's speed or the corner radius; both
come from the shape alone.
