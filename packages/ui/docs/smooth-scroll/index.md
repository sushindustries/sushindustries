---
title: Smooth Scroll
summary: Mounts Lenis for the page and renders nothing. Respects reduced motion.
---

`SmoothScroll` mounts Lenis for the whole document and renders nothing itself -
what changes is how the page feels under the wheel, easing instead of jumping
frame to frame. Mount it once near the root; anyone with reduced motion set
gets the browser's own scroll instead, which is correct for them.

<!-- ::start:showcase demo="smooth-scroll" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

It mounts inside an effect rather than at module scope, because Lenis
touches `window` and `document` immediately, and the root component that
renders it also renders on the server. Effects only run in the browser, so
the server render and the first client render both stay untouched, and Lenis
only takes over once there is an actual document for it to take over.
