---
title: Kbd
summary: A key, drawn as one. Semantically <kbd>, visually the chip the command palette already wears.
updated:
---

A single keyboard key, rendered as the semantic `<kbd>` element and styled as
the chip the command palette already wears. Reach for it anywhere prose or a
tooltip needs to show a key someone can press.

<!-- ::start:showcase demo="kbd" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The command palette already drew this chip for its own shortcuts, so `Kbd`
exists to be that one shape for "press this" everywhere it appears, rather
than a border and a background reinvented per page.

## What it does not do

It holds one key, not a chord. `⌘K` is two `<Kbd>` elements joined by plain
text or a `+`, not one `<Kbd>` wrapping both characters - the chip shape was
drawn for a single press, and a chord inside it reads as one press instead
of two.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
