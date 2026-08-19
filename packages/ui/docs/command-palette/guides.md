---
title: Guides
summary: Using Command Palette well, and the mistakes that look like it is broken.
---

## The host owns the shortcut and the routing

Nothing here listens for a keyboard shortcut to open itself - the host
wires whatever key (`⌘K`, `/`) to flipping `open`, and wires `onSelect`
to its own router. That split is deliberate: a palette that owns the
shortcut cannot be muted while a text field elsewhere on the page has
focus, and a palette that owns routing cannot be dropped into a project
with a different router.

## Matching is substring, not fuzzy

Typing "crd" will not find "Card" - matching is a plain substring over
`title`, `hint` and `group`, not scored fuzzy matching. That trade is on
purpose: fuzzy scoring reorders results as you type, and a first hit that
moves around is slower to use than one that is merely literal.

Only the first twelve matches render regardless of how many `entries`
match, so a long list depends on `hint` or `group` text narrowing things
down rather than scrolling.

## When not to use it

For a handful of destinations that fit in a normal nav menu, a palette
adds a keyboard-driven search surface nobody asked for - it earns its
place once there are enough entries that scanning a menu is slower than
typing a few letters.
