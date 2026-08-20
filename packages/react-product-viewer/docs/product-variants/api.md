---
title: Product Variants API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

Accepts every prop of `Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">`, plus:

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `variant` | `string` | - | The variant name, used as the accessible label. |
| `label?` | `string` | - | Shown instead of the raw variant name. |
| `swatch?` | `string` | - | Data URL from {@link useVariantSwatches}. |
| `selected?` | `boolean` | `false` |  |
| `missing?` | `boolean` | `false` | The asset does not carry this variant. Rendered as a visible state rather than hidden, because the failure this guards against is a control that looks like it works and does nothing. |
| `className?` | `string` | - | Added after `pv-variant`. |
| `showPendingSwatch?` | `boolean` | `false` | Reserve the swatch's space while it renders. Swatches arrive an effect late, so without this a row of buttons shifts sideways the moment the pictures land. |



<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.

<!-- /generated:api -->
