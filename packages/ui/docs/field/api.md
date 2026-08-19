---
title: Field API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `label` | `string` | - |  |
| `children` | `ReactNode` | - | The control. Rendered inside the label, so clicking the text focuses it. |
| `hint?` | `string` | - | One line under the control: what good input looks like. |
| `error?` | `string` | - | The validation message. Its presence is the error state. |

<!-- /generated:api -->

## Notes

`hint` and `error` are one slot, not two: `error` wins whenever both are
set, and the loser is not rendered at all rather than hidden with CSS. There
is no prop for a persistent hint that survives alongside an error - if that
combination is needed, put both sentences in whichever one you pass.

`children` has to be a single element for the nesting association to work;
`Field` does not clone it or attach anything to it beyond wrapping it in a
`<label>`.
