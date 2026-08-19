---
title: Reveal
summary: Fades and rises its children the first time they reach the viewport. Never un-reveals.
---

Reveal fades and rises its children into view the instant they first cross
into the viewport, then leaves them revealed. Reach for it to make a
section's content arrive rather than simply appear, and stack several with
staggered `delay` values so a group resolves top to bottom.

<!-- ::start:showcase demo="reveal" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The server and the first client render both emit the hidden state, so
hydration matches - an `IntersectionObserver` only flips it to shown once it
can actually measure the viewport. Deciding visibility from scroll position
during render would differ between server and browser and produce a mismatch
on every reload that starts part-way down the page. It never un-reveals,
either: content fading back out as you scroll up would read as a bug, not as
motion.

## What it does not do

It fires once and stops watching - there is no re-observing if the element
leaves the viewport again, so `Reveal` is not a fit for parallax or anything
that needs to keep tracking scroll position after the first entrance.
