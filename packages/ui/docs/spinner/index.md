---
title: Spinner
summary: One ring, one border, one turn - with a visually hidden label, because a spinner with nothing to announce is just an animation.
updated:
---

Spinner is a single turning ring with a label that is visually hidden but
still announced through `role="status"`. Reach for it whenever there is an
operation in flight worth telling someone about, not as decoration next to
something that already finished.

<!-- ::start:showcase demo="spinner" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The hidden label is why it exists as a status rather than just a CSS
animation: a spinner with nothing to announce is only motion, not
information. Reduced motion swaps the turn for a slower pulse instead of
removing it outright, because a spinner is still communicating "in progress
right now", unlike a skeleton, which just goes still.
