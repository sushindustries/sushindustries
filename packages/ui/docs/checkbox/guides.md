---
title: Guides
summary: Using Checkbox well, and the mistakes that look like it is broken.
---

## It is a native input, not a redrawn one

Every prop except `type` and `label` passes straight through to a real
`<input type="checkbox">` - `checked`, `onChange`, `disabled`,
`aria-describedby`, all of it. `accent-color` simply recolours the
platform's own control, so keyboard handling, form submission,
`indeterminate` and screen-reader behaviour are the browser's for free,
and there is nothing this component can get wrong that a plain `<input>`
could not.

## Grouping several

For a list of checkboxes, `.choice-group` in the stylesheet gives the
stacked spacing they are meant to sit inside - `Checkbox` itself has no
opinion about its siblings and renders one row regardless of how many
others surround it.
