---
title: Copy Button
summary: A glass chip that writes to the clipboard and confirms in the button itself.
updated: 2026-08-17
---

Copy, with the confirmation where the click happened. The chip swaps to a tick
and "Copied" for two seconds, then hands back - no toast, no portal, nothing
that has to know where the corner of the screen is.

<!-- ::start:showcase demo="copy-button" height="320" -->
<!-- ::end:showcase -->

## Why it is built this way

A toast library for one word is the wrong trade, but a `setState` after
unmount is still a leak, so the reset timer is cleared on unmount. The chip is
glass - fill plus edge, no blur - and it comes in two grounds: `slab` for the
charcoal of a code block, `paper` for everywhere else, because one glass recipe
cannot sit on both materials.

On fine pointers the chip appears on hover of its `code-shell`; on coarse
pointers it is always visible, because "appears on hover" is a desktop fiction
a phone cannot perform.

## What it does not do

It does not fall back to `document.execCommand`. `navigator.clipboard` exists
everywhere this site runs; where a permission denies it, the button simply
never confirms, which is the truthful rendering of what happened.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
