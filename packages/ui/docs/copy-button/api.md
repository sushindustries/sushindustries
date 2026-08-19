---
title: Copy Button API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `text` | `string` | - | What lands on the clipboard. |
| `label?` | `string` | `"Copy"` | Visible label at rest. The copied state always says "Copied". |
| `ground?` | `"slab" \| "paper" \| "accent"` | `"slab"` | Which material the chip sits on. `slab` is the charcoal of a code block; `paper` is everywhere else. The chip is glass either way - the ground decides what the glass is made of. |
| `icon?` | `IconName` | `"copy"` | Leading glyph at rest. The tick still takes over while copied. |

<!-- /generated:api -->

## Notes

`ground="slab"` is the default and also the value that gets no `data-ground`
attribute at all - the stylesheet's un-attributed rule already draws the slab
recipe, so `slab` is "say nothing" rather than "say slab explicitly".

There is no `onCopy` callback and no way to read whether the last copy
succeeded from outside the component - the copied state is purely visual and
resets on its own timer. A caller that needs to know the result should call
`navigator.clipboard` itself rather than trying to observe this button.
