---
title: Toggle
summary: A button that stays down, and the single-select group of them - aria-pressed is the whole contract.
updated:
---

A button that stays down: `aria-pressed` and `data-active` mirror the
`pressed` prop, and clicking hands back its opposite - the state itself lives
on the caller. `ToggleGroup` wraps a row of them behind one `value`, for a
single-select set of mutually exclusive options like a device or size picker.

<!-- ::start:showcase demo="toggle" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

`aria-pressed` is the entire contract, because the showcase's own device row
had already been drawing this shape for a while before it got a public name -
Toggle just gives it one. The component holds no state itself; it renders
`pressed` and calls back with its opposite. `ToggleGroup` is single-select
because that's what every use of it here has actually wanted; multi-select is
just several Toggles, each holding its own `pressed`.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
