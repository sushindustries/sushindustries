---
title: Item API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `string` | - |  |
| `description?` | `string` | - | One line under the title. |
| `meta?` | `string` | - | Right-aligned, in the label style. |
| `icon?` | `IconName` | - | Draws the tile at the left. Without it the row starts at the title. |
| `tone?` | `string` | - | Colour family for the tile, resolved by the stylesheet. Does nothing without `icon`. |
| `href?` | `string` | - | Renders the row as a link. |

<!-- /generated:api -->

## Notes

`title`, `description` and `meta` are all truncated with an ellipsis rather
than wrapped - a row is one line, always, whatever the container width. Set
`href` and the whole row becomes the link; there is no way to make only part
of the row - just the title, say - clickable without `href` on the row as a
whole.
