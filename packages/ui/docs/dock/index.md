---
title: Dock
summary: A launcher, what is open, and a corner. Search opens in the middle of the screen.
---

<!-- ::start:showcase demo="dock" height="360" -->
<!-- ::end:showcase -->

## Three parts

| Part | Is |
| --- | --- |
| The search control | a pill with a magnifier. It opens a window on the desk |
| The tasks | one button per open window; pressing one raises it |
| The corner | whatever the consumer puts there. On this site: a reset, a LinkedIn link and a clock |

## It has no state

Every version of this that held its own open flag, its own query and its own
results grew a second way to do something the desk already did. What is left is
a row of buttons and three callbacks: raise this, close this, open search.
