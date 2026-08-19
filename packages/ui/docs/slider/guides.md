---
title: Guides
summary: Using Slider well, and the mistakes that look like it is broken.
---

## Composing it

`Slider` already returns a `<label>` wrapping the input and its text -
`label` is required for exactly this reason, there is no unlabelled variant.
Do not nest it inside another `Field` or `<label>`; that puts two labels
around one control, and a screen reader announces both.

## When not to use it

For a value someone needs to type precisely - a price, a quantity, a date -
a slider trades away exact entry for a gesture that is fast but imprecise.
Reach for `Input` with `type="number"` there, and save `Slider` for values
where "close enough, seen at a glance" is the actual goal: volume,
brightness, a threshold on a chart.
