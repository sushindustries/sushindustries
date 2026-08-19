---
title: useScrollProgress
summary: How far one element has travelled up the viewport, 0 to 1, once per frame. Gated by an observer so an off-screen element costs nothing.
---

A hook that reports how far one element has climbed the viewport, from 0 to 1,
once per frame - not how far the page has scrolled. Reach for it to drive
anything that should animate in as an element arrives, like a progress bar or
a reveal, gated by an IntersectionObserver so off-screen elements cost
nothing.

<!-- ::start:showcase demo="use-scroll-progress" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

An IntersectionObserver gates the scroll listener rather than driving the
value, because observers report crossings, not positions - they can't give a
smooth progress on their own, but they're the cheapest way to stop measuring
an element nobody can see. The callback is expected to write to a ref
directly rather than call `setState`, for the same reason `useScrollTurn`
does: sixty updates a second would re-render a subtree sixty times a second.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
