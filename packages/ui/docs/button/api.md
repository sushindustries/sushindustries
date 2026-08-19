---
title: Button API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `href?` | `string` | - | Renders an anchor instead. A button that navigates is a link. |
| `onClick?` | `MouseEventHandler<HTMLButtonElement>` | - | Dropped when `href` is set - the anchor navigates instead. |
| `variant?` | `"pill" \| "ghost"` | `"pill"` | `pill` is the one action a section wants taken; `ghost` the alternative. |
| `type?` | `"button" \| "submit"` | `"button"` | `submit` is the only reason a button in a form should be anything else. |
| `disabled?` | `boolean` | - | Reaches the button only. An `href` cannot be disabled - do not render it. |

<!-- /generated:api -->

## Notes

`onClick` is accepted but ignored whenever `href` is also set - the
anchor navigates and no handler runs, so the two are effectively
exclusive even though the types allow passing both. `disabled` only
reaches the `<button>` element; passing it alongside `href` has no
effect, since an anchor has no disabled state to set.
