---
title: Guides
summary: Using Switch well, and the mistakes that look like it is broken.
---

## Composing it

`Switch` is already a complete `<label>` wrapping the input and its text -
`label` is required for that reason, there is no bare unlabelled input to
reach for. Do not nest it inside a `Field`; `Field` renders its own
`<label>` around whatever it is given, and a `Switch` inside one gets
labelled twice.

## Motion and reduced motion

The thumb's slide and the track's colour change are both CSS transitions,
and both are removed entirely under `prefers-reduced-motion: reduce` - the
checked state still changes instantly, just without the 180ms of travel.

## When not to use it

For a choice that only takes effect once a form is submitted - agreeing to
terms, opting into a newsletter - use `Checkbox` instead. `role="switch"`
tells assistive technology the change is immediate, the way a setting in an
app is; a checkbox in a form implies "mark this, then submit," which is a
different promise to make to someone using a screen reader.
