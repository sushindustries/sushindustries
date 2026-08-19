---
title: Guides
summary: Using Badge well, and the mistakes that look like it is broken.
---

## Variants

`tone` writes `data-tone`, and the stylesheet supplies five pairs -
`motion`, `layout`, `content`, `docs`, `3d`:

```tsx
<Badge tone="docs">Docs</Badge>
```

```css
.badge[data-tone="docs"] {
	background: var(--tone-docs);
	color: var(--tone-docs-ink);
}
```

These are the site's own category colours, shared with `Avatar`, `Card`
and the nav panel - inventing a sixth tone here means inventing a colour
nothing else agrees with, so a value outside the five just renders the
untoned default rather than a wrong colour.

## When not to use it

A badge is a label, not a control - it has no `href` or `onClick`, and
wrapping one in a link changes nothing about how it looks or announces
itself. For a filter chip that actually does something when clicked,
reach for the pattern `Archive` uses instead: an anchor styled as a chip,
not a badge wrapped inside one.
