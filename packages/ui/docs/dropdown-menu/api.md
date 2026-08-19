---
title: Dropdown Menu API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `label` | `string` | - | The button's text. Also the menu's accessible name. |
| `items` | `readonly DropdownItem[]` | - |  |
| `onSelect` | `(id: string) => void` | - | Called with the item's id. Not called for a disabled item. |
| `icon?` | `IconName` | - | Drawn in the button, before its label. |
| `align?` | `"start" \| "end"` | `"start"` | Which edge the menu lines up with. `end` for a right-hand column. |
| `buttonClassName?` | `string` | `"btn btn-quiet btn-sm"` | Replaces the button's classes, for a menu that is an icon in a table. |
| `empty?` | `string` | `"Nothing to do here."` | Nothing to do here, said in the menu rather than by a missing button. |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
