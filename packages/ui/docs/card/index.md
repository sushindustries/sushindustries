---
title: Card
summary: Title, optional meta, arbitrary body. Heading level is a prop so the outline stays correct.
---

Card is a title, optional meta, and whatever body content is passed as
children - the container most content on the site sits in. It grows into an
image card or an icon-tile card from props rather than a `variant` enum, and
renders as a link when given `href`.

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

An image card and an icon-tile card are not a `variant` prop - they are what
Card grows into when given an `image` or an `icon`, because a card with an
image *is* the image variant. Images crop to a fixed ratio so a grid of cards
holds a line regardless of what was uploaded. The heading level is a prop
(`as`) rather than a fixed `h3`, because a card's place in the document
outline is the page's business, not the card's - getting it wrong is one of
the few styling mistakes a screen reader actually punishes.

## What it does not do

It does not pick its own heading level. The default `h3` assumes the card
sits under an `h2` section; a different nesting needs `as` set explicitly.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
