---
title: Aspect Ratio
summary: A box that keeps its shape and fills whatever is put in it. CSS aspect-ratio, as a prop.
updated:
---

`AspectRatio` is a box that holds a width-to-height ratio and stretches its
contents to fill it edge to edge. Reach for it wherever an image, video, or
embed needs a fixed shape before it loads, so the layout does not jump.

<!-- ::start:showcase demo="aspect-ratio" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

CSS `aspect-ratio` does the entire job; the component exists only so the
number arrives as a prop instead of an inline style somebody has to remember
the syntax for. The default is 16/9, and whatever is passed as children fills
the box edge to edge without extra styling of its own.

## What it does not do

It takes one ratio, not a responsive set. A box that needs 4/3 on a phone and
16/9 on a desktop wraps two of these behind a media query, or computes the
number itself - this component does not read breakpoints.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
