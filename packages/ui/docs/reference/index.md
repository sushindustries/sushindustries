---
title: Reference
summary: An inline mention that carries a hover card with the target's own summary.
updated: 2026-08-17
---

Prose that names `Showcase` and prose that links to it used to be two different
sentences the author had to choose between.

A reference is both: it reads inline like code, and hovering it raises a card
with the component's title, summary and package - so the reader decides whether
the mention is worth a page visit before paying for one. Entering the mention
follows the link.

<!-- ::start:showcase demo="reference" height="340" -->
<!-- ::end:showcase -->

## Why it is built this way

The card is server markup that a stylesheet reveals - no JavaScript positions
it and none opens it, so a page full of references costs nothing at hydration.
`:focus-within` keeps it reachable by keyboard, and on coarse pointers the
first tap opens and the second follows, which is native anchor behaviour left
alone.

`MarkdownView` applies these automatically: pass it a `references` map keyed by
the exact inline-code text to match, and every `` `Showcase` `` in a document
becomes a walkable mention with zero authoring changes. The map is supplied by
the host, so matching stays a lookup rather than entity extraction.

## What it does not do

It does not guess. A mention resolves because the host said it does, and an
unmatched mention stays ordinary inline code. It does not nest inside an
existing link - a hover card inside somebody's chosen anchor would be two
navigations fighting over one word.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
