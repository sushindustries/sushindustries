---
title: Native Select API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

Accepts every prop of `SelectHTMLAttributes<HTMLSelectElement>`.

<!-- /generated:api -->

## Notes

There are no props beyond what `<select>` already takes - `NativeSelect` is a
thin wrap, not a variant. `className` lands on the `<select>` itself, merged
after `field-control`; it never reaches the wrapping span or the chevron, so
a class meant to move either has nothing to select from outside.
