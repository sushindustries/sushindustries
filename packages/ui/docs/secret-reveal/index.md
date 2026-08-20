---
title: Secret Reveal
summary: A credential shown once: it wraps rather than scrolls, one click selects all of it, and the copy button sits under it rather than over it.
updated: 2026-08-20
---

A token, a one-time link or a recovery code, at the single moment it is
visible. Reach for it wherever something is shown that cannot be shown again -
after minting an API key, after generating an invitation, after resetting a
password - and where the cost of the reader copying nine tenths of it is a
support conversation.

<!-- ::start:showcase demo="secret-reveal" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

This was written out five times before it became a component, and the five
copies were not identical - which is the actual cost. One of them scrolled
horizontally and one wrapped, so one of them showed a token with its tail off
the right-hand edge.

So it wraps, always. A document that scrolls loses nothing, because the reader
scrolls it. A credential whose end is out of view looks complete and is not.

The second decision is `user-select: all`, which makes one click take the whole
value. The clipboard API only exists in a secure context, so on a laptop over
plain `http` the copy button silently never confirms - selecting by hand is the
path that always works, and this makes it a single gesture rather than a
careful drag.

## What it does not do

It does not know the value is secret. Nothing is redacted, obscured or omitted
from the DOM; this is a presentation component, and keeping a credential out of
logs and out of a second render is the caller's job.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack, shadcn and pnpm
> commands appended to the bottom of this tab, along with its version,
> dependencies and files. Do not add your own - the generated ones cannot go
> stale, and a second copy immediately does.
