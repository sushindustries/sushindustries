---
title: Tooltip
summary: One line on hover and focus, in the markup rather than in title= - and never carrying controls.
updated:
---

A single line of text revealed on hover and on focus, written in the markup
instead of a `title` attribute, so every reader - mouse or keyboard - sees the
same thing. Use it for a short label on an icon button or an abbreviation,
never for anything that needs a link or a control inside it.

<!-- ::start:showcase demo="tooltip" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

A tooltip is a `title` attribute with better clothes. CSS reveals the bubble
on hover and on `:focus-within`, so keyboard users get it too, and because the
label lives in the markup instead of `title=`, every reader sees the same
consistent thing rather than the browser's own rendering of it. It never
carries controls on purpose - anything that needs to be clicked or read at
length is the reference hover card, not this.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
