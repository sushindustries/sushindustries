---
title: Checkbox
summary: A native checkbox with its words attached, painted by accent-color rather than redrawn.
updated:
---

Checkbox is a native `<input type="checkbox">` with its label attached,
painted in the site's accent color by `accent-color` rather than hidden and
redrawn. Reach for it for any single yes/no or multi-select choice in a form.

<!-- ::start:showcase demo="checkbox" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

One CSS property, `accent-color`, is the entire style layer. That keeps every
native behaviour a hand-drawn checkbox has to rebuild - keyboard handling,
form submission, the indeterminate state, screen-reader semantics - for the
cost of a single declaration, and a custom-drawn replacement earns none of it
back.

## What it does not do

It does not render a custom checkmark or animate the check. The box is the
browser's own, so its look is whatever `accent-color` and the platform agree
on, not a shape pulled pixel for pixel from a mockup.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
