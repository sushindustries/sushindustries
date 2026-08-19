---
title: Section API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `id?` | `string` | - | Anchor target, so a nav can link straight to it. |
| `label?` | `string` | - | The small monospace kicker above the heading. |
| `title` | `string` | - |  |
| `children` | `ReactNode` | - |  |

<!-- /generated:api -->

## Notes

`title` is required and always renders as an `h2` - there's no way to get an
`h1` or `h3` out of this component. A page's own `h1` belongs to its `Hero`;
`Section` is for what comes after it.

The 80ms stagger between heading and body is fixed, not a prop. It exists to
keep the two halves off the same animation frame, not to be tuned per
section.
