---
title: Button
summary: The pill and the ghost - one action and its alternative, with no third variant on purpose.
updated:
---

Button is one action and its alternative: `pill` for the one thing a section
wants done, `ghost` for everything else, with no third variant. Pass `href`
and it renders an anchor instead of a `<button>`, because an action that
navigates is a link, not a click handler pretending to be one.

<!-- ::start:showcase demo="button" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

There is no third variant because a row of three button styles is a menu
wearing costumes - `pill` and `ghost` are a hierarchy, not a palette. `href`
switches the rendered element from `<button>` to `<a>`, not the look: the
reader cannot tell a link-shaped action from a button-shaped one, and should
not have to work that out from the styling.

## What it does not do

It does not accept both `href` and `onClick` at once - passing `href` renders
an anchor and `onClick` is dropped, because an action that both navigates and
runs a handler is usually two actions wearing one button.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
