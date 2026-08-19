---
title: Reveal API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `delay?` | `number` | `0` | Stagger within a section, in milliseconds. |

<!-- /generated:api -->

## Notes

There's no prop to re-trigger a `Reveal` or make it un-reveal - once `shown`
flips to true the observer disconnects for good. A `Reveal` mounted already
past the trigger point (deep in a route that renders scrolled) reveals on its
first measurable frame rather than waiting on a scroll event that may never
come.

`delay` only staggers the CSS transition; it doesn't delay when the
intersection observer fires. Two `Reveal`s at the same scroll position both
trigger together and differ only in when their own transition starts.
