---
title: Progress
summary: The native progress element, restyled - omit value and the indeterminate state is real.
updated:
---

A labelled progress bar built on the native `<progress>` element. Give it a
`value` for a real fraction, or omit it for the indeterminate sweep the
browser draws for "something is happening, no percentage yet."

<!-- ::start:showcase demo="progress" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

`<progress>` carries its own semantics, so a reader hears the fraction
announced with no ARIA written here. Omitting `value` gets the real
indeterminate state the browser draws, rather than a bar animated to fake
one. `label` has no default, because a bar with nothing to announce alongside
the number is not accessible to fix later.

## What it does not do

It does not fake progress. A bar that fills on a timer to look busy tells a
smaller truth than the indeterminate sweep does, so `value` is for a real
fraction only - there is no "looks like progress" mode.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
