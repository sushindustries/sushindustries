---
title: Skeleton
summary: The wait, drawn as the thing being waited for: a line, a block or a circle, shimmering unless motion is reduced.
updated:
---

Skeleton draws the wait as the shape of the thing being waited for: a line of
text, a block of media, a circle of an avatar. Reach for it anywhere content
has not arrived yet and a placeholder should stand in its shape until it
does.

<!-- ::start:showcase demo="skeleton" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The three shapes cover every loading state this site has actually needed, so
there is no fourth. Reduced motion is handled by removing the shimmer
outright rather than swapping it for something gentler - a static placeholder
still says "coming", and says it calmly, for someone who asked for less
motion rather than none.
