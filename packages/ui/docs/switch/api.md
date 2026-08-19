---
title: Switch API
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

The input underneath is a real `<input type="checkbox">`, so every native
checkbox prop applies as-is - `defaultChecked`, `checked`, `onChange`,
`disabled`, `required`. `type` is not in the prop list because it is fixed;
there is no way to make this render anything other than `role="switch"` on
a checkbox.
