---
title: Item
summary: One row of a list: tile, title, description, meta - the nav panel's anatomy, extracted for reuse.
updated:
---

One row of a list: an optional toned icon tile, a title, a fainter
description line, and a right-aligned meta label, rendered as a link when
`href` is given. Reach for it for a settings row, a changelog entry or any
list whose rows share that shape.

<!-- ::start:showcase demo="item" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The nav panel and the command palette had already drawn this exact anatomy
before `Item` existed, so extracting it stops a settings page or a changelog
from rebuilding a slightly different version a third time. `tone` colours the
icon tile through `data-tone` and does nothing without `icon`, because the
tile is the only thing it was ever meant to colour.

## What it does not do

It draws one row and nothing that manages many of them: no list wrapper, no
active-item tracking, no keyboard navigation between rows. Stack several
inside a `<ul>` or a flex column and that stays the consumer's concern, which
is what lets `Item` sit next to the nav panel or the palette without
depending on either.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
