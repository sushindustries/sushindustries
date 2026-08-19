---
title: Guides
summary: Using Textarea well, and the mistakes that look like it is broken.
---

## Composing it

`Textarea` already carries `field-control field-textarea` - any `className`
passed in is appended, not swapped in, so a caller only ever adds to the
control's look rather than needing to reconstruct it. Pair it with `Field`
for a label, a hint or an error state; `Textarea` on its own is the control
alone, the same as `Input`.

## When not to use it

For a single line of free text, `Input` is the right size - `Textarea`'s
growing behaviour and taller minimum height cost vertical space a one-line
field does not need. Reach for this one when the content is genuinely
multi-line: a message, a description, anything where the number of lines
isn't known ahead of time.
