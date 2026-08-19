---
title: Guides
summary: Using Card well, and the mistakes that look like it is broken.
---

## Composing it

Cards read best inside `.card-grid`, which sizes columns to
`clamp(260px, 30vw, 320px)` and lets them wrap - a single `Card` outside
a grid works fine on its own, but a row of them without the grid class
will not line up. Image cards crop to 16:9 automatically, so uploads of
different sizes still produce a level row.

## The heading level is not decorative

`as` exists because a card sits at different depths in different pages'
outlines - getting it wrong is invisible visually, and flagged by every
outline-based accessibility check.

```tsx
// A grid of cards under a page's own h1
<Card title="Accordion" />

// One card standing in for a whole section's own heading
<Card as="h2" title="Featured" />
```

## When not to use it

`title` is required - a tile that is only an image or only an icon with
no heading belongs in a different component. `Card` assumes a heading is
always present, because the outline argument above depends on one
existing.
