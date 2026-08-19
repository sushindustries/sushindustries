---
title: Switch
summary: A checkbox that admits it: a real input with role=switch, and a track :checked drives.
updated:
---

Switch is a checkbox that admits what it is: a real input carrying
`role="switch"`, drawn as a track and thumb on its label. Reach for it for a
setting that takes effect the instant it is toggled, not one that waits for a
form to be submitted.

<!-- ::start:showcase demo="switch" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

`role="switch"` without a managed `aria-checked` is a promise half kept, so
the input underneath stays a genuine, native checkbox rather than a styled
div faking the semantics - announced honestly, with the track and thumb
driven by `:checked` rather than by React state.
