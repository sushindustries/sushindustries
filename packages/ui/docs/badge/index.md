---
title: Badge
summary: A word wearing a fill, in the site's own tone pairs - a badge invents no colour of its own.
updated:
---

Badge is a word wearing a fill, sized for a label rather than a sentence. Its
`tone` selects one of the site's own category color pairs, so a badge reading
"Motion" matches "Motion" everywhere else it appears - the nav, the archive
filters - rather than inventing its own color.

<!-- ::start:showcase demo="badge" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The tone values are not badge-specific colors - they are the same category
pairs the nav and the archive already use, resolved by the stylesheet from a
`data-tone` attribute rather than redrawn per component. A badge invents no
color of its own, so "motion" on a badge and "motion" in the nav are visibly
the same claim, not two designers' guesses at the same idea.

## What it does not do

It has no dismiss button and no click handler - it is a `<span>` with a
fill, not a filter chip or a tag input. Reach for a different component if
the badge itself needs to do something when pressed.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
