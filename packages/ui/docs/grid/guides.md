---
title: Guides
summary: When to pin the column count, how to write a grid in Markdown, and what `gap` accepts.
---

## When to pin the count

```tsx
<Grid columns={2}>
```

For content that is genuinely paired. A before and an after that reflow to one
column stop being a comparison, so a pinned grid holds until the narrow
breakpoint and then gives up all at once rather than degrading through an
awkward middle.

If you find yourself pinning the count for anything else, `min` is the thing you
actually wanted.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## In Markdown

```text
<!-- ::start:grid min="18rem" gap="4" -->

Anything at all, including other blocks.

<!-- ::end:grid -->
```

This exists because Markdown gives an author no way to say "these things go
side by side". Without it the workaround is an HTML table, which then has to be
undone at every width.

## Spacing

`gap` is a step on the scale, not a pixel value. There is no arbitrary-value
syntax here and that is deliberate: a short scale is what makes a set of
sections look measured rather than assembled.
