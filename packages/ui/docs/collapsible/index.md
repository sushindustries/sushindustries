---
title: Collapsible
summary: One details, dressed - a sentence that opens, for prose rather than lists.
updated:
---

Collapsible is a single `<details>` element dressed with a summary line and a
chevron, for one expandable sentence or paragraph inside prose. Reach for
Accordion instead once there is a list of several items that should each be
able to open independently.

<!-- ::start:showcase demo="collapsible" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

It is a separate component from Accordion rather than an accordion of one
item, because the composed component imposes a list shape that a single line
inside a paragraph does not want. A collapsible inside prose is a sentence
that opens, not a stack of one.

## What it does not do

After the first paint, `defaultOpen` does not force anything - it only seeds
the initial state, and the reader's own toggle stands after that. There is no
controlled `open` prop or callback for tracking state from outside.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
