---
title: Radio Group API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `label` | `string` | - | Group label, announced with the set. |
| `options` | `readonly RadioOption[]` | - | Empty renders a legend and nothing else. Values must be unique in the set. |
| `value?` | `string` | - | Controlled selection. Set it and nothing moves until `onChange` comes back. |
| `defaultValue?` | `string` | - | Uncontrolled starting selection. Ignored once `value` is set. |
| `onChange?` | `(value: string) => void` | - | Handed the option's value, not the event. |
| `name?` | `string` | - | The shared radio name. A generated id when absent, so two groups on one page never merge. |

<!-- /generated:api -->

## Notes

`value` and `defaultValue` are mutually exclusive in practice, not just in
naming - once `value` is set the group is controlled, `defaultValue` is
ignored, and nothing moves until `onChange` returns a new `value`. Passing
both is the same trap as a native controlled input: pick one.

`name` only needs setting by hand when two groups must share one radio name
on purpose, or when a specific name matters for form submission. Left
absent, the generated id keeps two `RadioGroup`s on the same page from
merging into one set.
