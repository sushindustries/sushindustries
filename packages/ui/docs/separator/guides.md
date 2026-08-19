---
title: Guides
summary: Using Separator well, and the mistakes that look like it is broken.
---

## Composing it

A vertical separator needs a height to span - it has none of its own. Give
the row `align-items: stretch`, or give the separator's parent an explicit
height; without either, `orientation="vertical"` renders a line with nothing
to be tall against.

## Variants

`orientation` writes `data-orientation` on the element, the same pattern
every variant in this library uses - a prop, never a second class:

```tsx
<Separator orientation="vertical" />
```

```css
.separator[data-orientation="vertical"] {
	width: 1px;
	height: 100%;
}
```

`decorative` isn't a variant in that sense - it swaps the actual element
between `<hr>` and `<span>`, because whether a rule is announced is an
accessibility decision, not a look.
