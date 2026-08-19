---
title: Guides
summary: Using Sheet well, and the mistakes that look like it is broken.
---

## Variants

`side` writes `data-side` on the `<dialog>`, which the stylesheet reads to
decide which edge it docks to and which direction it slides from:

```tsx
<Sheet side="left" open={open} onClose={onClose} title="Filters">
```

```css
.sheet[data-side="left"] {
	inset-inline: 0 auto;
}
```

## When not to use it

For content short enough to centre on screen - that's `Dialog`, the same
native-element recipe without the docked geometry. `Sheet` earns its edge
position when the content is a list or a form tall enough that centring it
would mean scrolling a floating box in the middle of the page.
