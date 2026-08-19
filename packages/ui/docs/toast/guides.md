---
title: Guides
summary: Using Toast well, and the mistakes that look like it is broken.
---

## Composing it

`ToastProvider` is one instance, mounted once near the root - the same as
`SmoothScroll`. Every `useToast()` call anywhere beneath it shares the one
`role="status"` region and the one bottom-right corner; there is no reason
to mount a second provider except to give a specific subtree its own
`duration`.

## Motion and reduced motion

Each toast animates in with a short slide and fade; under
`prefers-reduced-motion: reduce` that animation is removed and the card
simply appears. Nothing about the four-second dismissal timer changes -
reduced motion affects how it arrives, not how long it stays.

## When not to use it

Strings only, four seconds, one shape - there is no action button, no
promise-tracking, no progress state, and no way to keep one on screen past
its timer. For a message that needs a "Undo" button or has to persist
until someone reads it, `Toast` is the wrong tool; build that with `Dialog`
or `Sheet` instead, where dismissal is deliberate rather than timed.
