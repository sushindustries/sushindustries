---
title: Guides
summary: Using Reveal well, and the mistakes that look like it is broken.
---

## Composing it

It renders a plain `<div>` around `children` - one extra box in the DOM,
which matters if the parent is a CSS grid or flex context that counts direct
children. Nest more than one `Reveal` with staggered `delay` values, the way
`Section` does with its heading and body, to make a group resolve top-down
rather than as one block.

## Motion and reduced motion

`prefers-reduced-motion: reduce` skips the fade entirely - the check runs
once on mount, and if it matches, `Reveal` sets itself to shown immediately
instead of waiting on the intersection observer. Content is never left
hidden waiting for motion that will not happen.
