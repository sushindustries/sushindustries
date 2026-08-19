---
title: Guides
summary: Using Aspect Ratio well, and the mistakes that look like it is broken.
---

## Composing it

The box needs a definite width from its parent - a grid cell, a flex item
with `flex: 1`, a fixed-width container - because `aspect-ratio` computes
height from width, not the other way round. A parent with no width
resolves to a box with no height, which reads as "the component renders
nothing" when the actual cause is one level up.

## Every direct child fills the box

`.ratio > *` positions every direct child absolutely, not only the first,
so passing more than one child stacks them on top of each other rather
than laying them out side by side. That is useful for an image with a
caption overlay; it is a bug if the goal was two things side by side,
which needs its own flex wrapper around them first.

## When not to use it

For a single known image at a known size, a plain `<img>` with `width`
and `height` attributes gets the same layout stability from the browser's
own intrinsic-size reservation, with no wrapper element. Reach for this
component when the ratio has to hold regardless of what loads into it -
a video, an iframe, an image whose real dimensions are not known ahead of
time.
