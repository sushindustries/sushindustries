---
title: Scroll Area API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `maxHeight?` | `string` | `"20rem"` | CSS max-height; scrolling starts past it. |

<!-- /generated:api -->

## Notes

`data-lenis-prevent` is always set, not conditional on `maxHeight` or on
whether the content actually overflows - a `ScrollArea` shorter than its
content costs nothing extra by carrying the attribute unused.

`maxHeight` takes any CSS length, not just the scale's tokens - `"50vh"` and
`"320px"` are both valid, since a scroll boundary is one of the few places a
literal value is the point rather than the drift a token exists to prevent.
