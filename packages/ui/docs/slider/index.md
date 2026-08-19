---
title: Slider
summary: A native range input with its label - keyboard steps and form value ship in the element.
updated:
---

Slider is a native `<input type="range">` with its label attached, painted
through `accent-color`. Reach for it wherever an approximate drag beats a
typed number - volume, brightness, a threshold on a chart.

<!-- ::start:showcase demo="slider" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

It stays a native range input rather than a rebuilt one because everything a
rebuilt slider spends its life re-earning - keyboard steps, page-up and
page-down jumps, RTL support, participating in a form's value - ships for
free in the browser's own element.
