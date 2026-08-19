---
title: Command Palette API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `entries` | `readonly PaletteEntry[]` | - | Everything searchable. Matched by substring, and only the first twelve hits are shown. |
| `open` | `boolean` | - | Drives `showModal`. Opening clears the query and puts the selection back on the first hit. |
| `onClose` | `() => void` | - | Escape, the backdrop and the close event all arrive here. The host still owns `open`. |
| `onSelect` | `(entry: PaletteEntry) => void` | - | Called with the chosen entry; the host owns navigation. |
| `placeholder?` | `string` | `"Search"` | The only hint at what is searchable - nothing else labels the field. |

<!-- /generated:api -->

## Notes

`entries` should be a stable list - the component reads `id` for React's
key and for `aria-activedescendant`, so two entries sharing an `id`
collide silently and only one behaves correctly. Matching happens
against `title`, `hint` and `group` together; an entry with a
distinctive `hint` is reachable even when its `title` alone would not
match what somebody typed.
