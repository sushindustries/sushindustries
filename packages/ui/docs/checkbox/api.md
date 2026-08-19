---
title: Checkbox API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

Accepts every prop of `Omit<InputHTMLAttributes<HTMLInputElement>, "type">`, plus:

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `label` | `string` | - |  |

<!-- /generated:api -->

## Notes

Every prop except `type` passes straight through to the underlying
`<input>`, so `checked`, `onChange`, `disabled`, `required` and any
`aria-*` attribute all work exactly as they would on a plain checkbox.
`type` is not exposed at all - the component fixes it to `"checkbox"`,
so there is no way to accidentally render a radio through this
component.
