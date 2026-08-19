---
title: Slider API
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

`type` is omitted from the props on purpose - the input is always
`type="range"`, so there is nothing to pass that would change it. `min`,
`max` and `step` are not defaulted by this component; leave them off and you
get the browser's own range defaults (0 to 100, step 1), the same as a bare
`<input type="range">`.
