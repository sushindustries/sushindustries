---
title: Showcase
summary: A component at every width it has to survive, with its source, install commands, and a live StackBlitz editor.
---

The frame below is the component this page documents, showing another
component. Switch the width - the layout changes because the preview really is
a different viewport.

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Why an iframe

Because a resized `div` lies.

A div at 390px still inherits the page's viewport, so `@media (max-width: 860px)`
never fires inside it. A component can look perfect in a showcase built that way
and break on an actual phone. An iframe has its own viewport, so the media
queries that run are the real ones.

## What else it shows

| Control | Does |
| --- | --- |
| Preview / Code / StackBlitz | the running component, the source, or a live editor |
| Install rows | the TanStack and shadcn commands, attached automatically |

> [!NOTE] Install commands are not written by hand
> Anything in the registry gets its commands attached from its registry entry,
> so "how do I get this" is never something an author has to remember.
