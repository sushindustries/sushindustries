---
title: Guides
summary: Using Scroll Area well, and the mistakes that look like it is broken.
---

## When not to use it

For the page's own vertical scroll - that's Lenis's job, and wrapping the
whole page (or a large section of normal page flow) in `ScrollArea` fights
the smooth scroller instead of cooperating with it. Reach for it only for a
genuinely separate, bounded region: a changelog panel, a code block, a list
inside a card.
