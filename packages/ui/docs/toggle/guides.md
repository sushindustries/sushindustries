---
title: Guides
summary: Using Toggle well, and the mistakes that look like it is broken.
---

## Composing it

`Toggle` holds no state - it renders `pressed` and calls
`onPressedChange(!pressed)` on click, nothing more. Somewhere above it has
to own that boolean, the same as a controlled `<input>`; a `Toggle` with a
`pressed` prop that never changes is a button that looks stuck because it
is stuck.

## Toggle vs ToggleGroup

`Toggle` is one button and one boolean. `ToggleGroup` is a row of them
sharing a single `value`, wrapped in a `<fieldset>` with its own accessible
`label` - reach for it the moment two or more toggles are meant to be
mutually exclusive, rather than composing several `Toggle`s and enforcing
that by hand. Neither gives keyboard users arrow-key movement between
options the way `ThemeToggle`'s radiogroup does; each button in a
`ToggleGroup` is its own tab stop.

## When not to use it

For a larger set of mutually exclusive options where arrow-key navigation
between them matters - a segmented control of five or six choices, say -
`ThemeToggle`'s `radiogroup` pattern is the better fit; `ToggleGroup` is a
row of ordinary buttons, not a roving-focus group.
