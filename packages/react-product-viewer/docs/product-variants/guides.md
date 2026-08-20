---
title: Guides
summary: Using Product Variants well, and the mistakes that look like it is broken.
---

The Guides tab is for the things that are true after it works. If it belongs in
"how do I install this", it goes in Get Started; if it is a prop table, it goes
in API.

## Composing it

What it is meant to sit inside, and what it expects from that parent. Most
components that "do not work" are components in a parent that gives them no
height, no position or no width.

## Variants

Variants are data attributes, never a second class name. The component takes a
prop; the prop writes `data-*`; the stylesheet selects on it:

```tsx
<Something tone="quiet" />
```

```css
.product-variants[data-tone="quiet"] {
	color: var(--fg-faint);
}
```

Adding a class from the outside works exactly once, on the page that also has
the CSS for it. A prop travels with the component.

## Motion and reduced motion

If it animates, say what it does under `prefers-reduced-motion: reduce`, and
say it here rather than leaving somebody to test it.

## When not to use it

The case this is the wrong answer to. A component that lists this is a
component somebody can decide against quickly, which is a service.
