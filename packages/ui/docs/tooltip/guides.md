---
title: Guides
summary: What Tooltip is for, the delay that keeps it from flickering, and why it never carries a link.
---

## Composing it

`Tooltip` wraps its child in an inline-block span, so it sits inline wherever
the child would: around a word, around an icon-only button, around anything
with a box to hover. There is no layout requirement beyond that - the bubble
is `position: absolute` against the wrapper, so it never affects the height of
whatever contains it.

## The delay is one-sided

The bubble waits 350ms before it appears and fades out in 140ms with no delay
at all. That asymmetry is deliberate: a tooltip that opened the instant the
pointer landed would flash on every pass the cursor makes on its way
somewhere else, but once it is open there is no reason to make somebody wait
to see it go.

## When not to use it

It is one line by contract. Anything richer - a preview, a set of facts, a
link - is the reference hover card, not this. And it never carries controls:
the bubble is `role="tooltip"` and not reachable by tab, so a link or button
placed inside it is invisible to a keyboard.
