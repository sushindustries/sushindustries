---
title: Guides
summary: Using Skeleton well, and the mistakes that look like it is broken.
---

## Composing it

Each shape assumes a different parent, because each one sizes itself
differently:

| Shape | Sizes itself | Needs from the parent |
| --- | --- | --- |
| `line` | 100% wide, 0.9em tall | a real width - a flex row or a block |
| `block` | 100% wide, 16/9 aspect ratio | a real width, or it renders at zero height |
| `circle` | fixed 40 by 40 | nothing - ignores the parent entirely |

`width` and `height` override any of these directly, on any shape.

## Variants

`shape` is the one variant, and it is a `data-shape` attribute rather than a
class, so the stylesheet - not the caller - decides what `"line"`,
`"block"` and `"circle"` look like:

```tsx
<Skeleton shape="circle" />
```

```css
.skeleton[data-shape="circle"] {
	width: 40px;
	height: 40px;
	border-radius: 999px;
}
```

## Motion and reduced motion

Under `prefers-reduced-motion: reduce` the sweep animation is removed
entirely and the shape falls back to a flat `--bg-2` fill. Nothing pulses or
fades instead - a skeleton is a placeholder, and a placeholder that keeps
moving for someone who asked for less motion is still moving.

## When not to use it

Not a loading indicator - it has no `role="status"` and announces nothing,
because it is meant to disappear the instant real content is ready, not to
tell anyone how long that will take. Reach for `Spinner` when there is an
operation in flight worth announcing, and for content already on the page
that is merely stale (a table mid-refetch, say) rather than absent.
