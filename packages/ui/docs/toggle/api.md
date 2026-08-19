---
title: Toggle API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | What pressing it means. |
| `pressed` | `boolean` | - | Drives `aria-pressed` and `data-active`. The state is the caller's - nothing moves on its own. |
| `onPressedChange` | `(pressed: boolean) => void` | - | Handed the opposite of `pressed`, never the event. |

### ToggleGroupProps

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `options` | `readonly { value: string; label: ReactNode }[]` | - | The choices, keyed by value. |
| `value` | `string` | - | The pressed option. One matching nothing leaves every button up. |
| `onChange` | `(value: string) => void` | - | Handed the chosen value. Pressing the option already down fires it again. |
| `label` | `string` | - | Announced name of the group. |

<!-- /generated:api -->

## Notes

`Toggle` and `ToggleGroup` share no state between them - a standalone
`Toggle` is not aware of any `ToggleGroup` on the same page, so faking a
single-select group out of several `Toggle`s means enforcing mutual
exclusivity by hand. `ToggleGroup` exists so that bookkeeping does not have
to be reinvented per page; reach for it instead of composing `Toggle`s the
moment two options are meant to be exclusive.
