---
title: Showcase
summary: A component at three viewport widths, with its source and install commands.
---

The frame below is the component this page documents, showing another
component. Switch the width — the layout changes because the preview really is
a different viewport.

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Why an iframe

Because a resized `div` lies.

A div at 390px still inherits the page's viewport, so `@media (max-width: 860px)`
never fires inside it. A component can look perfect in a showcase built that way
and break on an actual phone. An iframe has its own viewport, so the media
queries that run are the real ones.

## What it shows

| Control | Does |
| --- | --- |
| Preview / Code | the running component, or the source that produced it |
| Desktop / Tablet / Mobile | 100%, 834px, 390px |
| Install rows | the TanStack and shadcn commands, attached automatically |

Widths are device classes rather than exact models. Desktop is "whatever the
page has", because pinning it to 1280 would misreport how a component behaves
on a laptop.

> [!NOTE] Install commands are not written by hand
> Anything in the registry gets its commands attached from its registry entry,
> so "how do I get this" is never something an author has to remember.
