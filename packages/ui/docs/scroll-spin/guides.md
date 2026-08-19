---
title: Guides
summary: Using Scroll Spin well, and the mistakes that look like it is broken.
---

## Composing it

`ScrollSpin` draws its own stage - a square box sized against its
container's width and the viewport height, centred, with the `perspective`
that makes the turn read as an object rather than a flat rotation. It needs a
parent with real width; inside something collapsed to zero (a flex child with
no basis) the square collapses with it.

## When not to use it

For anything that has to stay readable while it turns - body text, a form, a
diagram with labels around its edge. The rotation is the whole point for a
mark or a logo; it works against comprehension for anything a reader needs to
parse mid-turn.
