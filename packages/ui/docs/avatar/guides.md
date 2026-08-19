---
title: Guides
summary: Using Avatar well, and the mistakes that look like it is broken.
---

## Variants

`tone` writes `data-tone`, and it only matters for the initials fallback -
once an image loads, the fill sits behind a photograph nobody sees:

```tsx
<Avatar name="Ada Lovelace" tone="motion" />
```

```css
.avatar[data-tone="motion"] {
	background: var(--tone-motion);
	color: var(--tone-motion-ink);
}
```

The five tones are the same pairs the nav, badges and cards use -
`motion`, `layout`, `content`, `docs`, `3d` - so a person tagged to a
category reads as that category everywhere on the site.

## AvatarGroup counts from the whole list, not the visible part

`max` caps how many faces render, but `people.length` still decides the
overflow count - passing three people with `max={2}` always shows "+1",
never a wrong count from a slice taken too early. There is no dedupe: two
entries with the same `name` render as two separate circles.
