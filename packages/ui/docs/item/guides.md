---
title: Guides
summary: Using Item well, and the mistakes that look like it is broken.
---

The Guides tab is for the things that are true after it works. If it belongs in
"how do I install this", it goes in Get Started; if it is a prop table, it goes
in API.

## Composing it

`Item` draws one row and assumes nothing about what holds the rows - stack
several inside a `<ul>` or a plain flex column and each one lays itself out
the same way regardless. It is the anatomy the nav panel and the command
palette already use, so a list of `Item`s next to either will match without
any extra styling.

## Variants

`tone` is a real prop, not a placeholder - it writes `data-tone` on the icon
tile, and the stylesheet defines five: `motion`, `layout`, `content`, `docs`
and `3d`. Leaving it unset draws a neutral gray tile rather than no tile at
all.

```tsx
<Item title="Grid" icon="grid" tone="layout" />
```

There is no sixth tone to reach for informally - a new one is a new pair of
tokens in `atoms`, not a hex value passed through `className`.
