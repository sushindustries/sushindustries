---
title: Input API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

Accepts every prop of `InputHTMLAttributes<HTMLInputElement>`.

<!-- /generated:api -->

## Notes

There is no prop surface beyond the native one - no `tone`, no `invalid`,
no `size`. Validation styling comes from an ancestor `Field` writing
`data-invalid`, and `className` is appended after `field-control` rather
than replacing it, so a class passed in adds to the control's style instead
of overriding it outright.
