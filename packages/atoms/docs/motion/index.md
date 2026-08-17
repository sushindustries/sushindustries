---
title: Motion and depth
summary: Every transition, animation and perspective in the stylesheet, what each is for, and where it is used.
---

There are about a dozen moving things on this site. This is all of them, why
each moves at the speed it does, and which file to open.

The rule underneath the whole list: **motion answers a question the reader just
asked.** A panel opening was asked for by a press. A card lifting answers "is
this clickable". Nothing here moves to be noticed.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## The one easing token

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

One curve, used for everything that travels. It starts fast and settles slowly,
which is how a thing that was pushed behaves, and the long tail is what makes
an interface feel unhurried without actually being slow.

Plain `ease` is used for colour changes, because a colour does not have
momentum and giving it some reads as a delay.
