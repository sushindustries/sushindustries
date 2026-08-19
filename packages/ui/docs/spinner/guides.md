---
title: Guides
summary: Using Spinner well, and the mistakes that look like it is broken.
---

## Composing it

`Spinner` is `display: inline-block` and sized in pixels through `size`, so
it drops into a line of text or beside a button label without needing a
container of its own - `<Button disabled><Spinner size={14} />Saving</Button>`
works with no extra markup.

## Motion and reduced motion

The ring's turn is a CSS animation, and under `prefers-reduced-motion:
reduce` it is replaced with a slower opacity pulse rather than removed
outright - unlike `Skeleton`, which just goes still. A spinner communicates
that something is happening right now, so it keeps some movement; it is the
sweep, not the motion itself, that reduced motion objects to.

## When not to use it

Not a progress bar - there is no percentage prop and never will be, because
a ring has no notion of "how far". Reach for `Progress` when there is a
measurable amount left, and for `Skeleton` when the thing waited for is
content that should stay silent rather than announce itself.
