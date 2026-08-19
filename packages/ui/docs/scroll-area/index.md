---
title: Scroll Area
summary: The named inner scroll: thin bar, and the smooth scroller handed back - the pair everyone forgets separately.
updated:
---

`ScrollArea` wraps a bounded region - a changelog panel, a code block, a list
inside a card - in the site's thin scrollbar, and hands the wheel back to the
page's smooth scroller the moment the cursor leaves it. Reach for it whenever
a piece of content needs its own scroll, not the page's.

<!-- ::start:showcase demo="scroll-area" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Two behaviours were being forgotten separately often enough to earn one name:
the site's thin scrollbar styling, and `data-lenis-prevent`, which tells the
smooth scroller to leave this subtree's wheel and touch events alone. Skip
either one and the region either looks like an unstyled native scrollbar or
fights the page for the same gesture.
