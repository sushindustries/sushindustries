---
title: Guides
summary: Using Accordion well, and the mistakes that look like it is broken.
---

## When not to use it

Every row here opens independently - opening one never closes another,
and there is no prop to change that. If the actual requirement is "only
one section open at a time", this is the wrong component: build it from
individual `Collapsible` instances and lift the open id into state,
rather than asking this one to fake exclusivity it was not built for.

## Reduced motion

Only the chevron animates - a 180ms rotation when a row opens. Under
`prefers-reduced-motion: reduce` the rotation is instant; the disclosure
itself has no transition to remove, since `<details>` opens and closes
without one on its own.
