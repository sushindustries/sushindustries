---
title: Guides
summary: Using Dialog well, and the mistakes that look like it is broken.
---

## `open` and `onClose` have to agree

The element itself closes on Escape and on a backdrop click, and both of
those call `onClose` - but neither one flips `open` to `false` by itself.
If `onClose` does not lead to `open` becoming `false`, the effect sees the
prop still `true` and immediately reopens the dialog you just watched close,
which looks like a flicker rather than an error.

## When not to use it

A palette that filters as you type, or a menu meant to be left quickly, is
not this component - `Dialog`'s job is to hold the page hostage until you
answer it, which is correct for a confirmation and wrong for anything meant
to be dismissed in passing.
