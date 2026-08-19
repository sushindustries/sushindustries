---
title: Guides
summary: Using Pagination well, and the mistakes that look like it is broken.
---

## Composing it

It's a `<nav>` sized to its own content, centred by `justify-content` on
itself - no parent height or width requirement. It works equally inside a
container with a max-width or full-bleed; the row just stays centred within
whatever it's given.

## When not to use it

When the total page count isn't known ahead of time - an infinite feed, a
search result stream that loads more as you scroll. `Pagination` needs
`pageCount` up front to compute the window; a "load more" button or an
infinite-scroll sentinel is the right shape for an unbounded list.
