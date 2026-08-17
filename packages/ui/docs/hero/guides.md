---
title: Guides
summary: What Hero takes from its host, how it builds its facts list, and why the picture is never lazy.
---

## Slots, not data

`Hero` takes React nodes for the parts that know about routes - the breadcrumb
trail and the buttons - and plain values for the parts that do not. That split
is deliberate: a component in this library must never know that this site has
a `/components` route, and a component that took a `slug` and built its own
links would know exactly that.

What it does own is the arrangement. Which things sit beside which, what wraps
first, and what the layout does when there is no picture.

## The facts are a definition list

Three or four labelled facts about the document - when it was last touched,
how long it takes to read, whether an agent can fetch it - are a definition
list, because that is what a definition list is.

The labels are visually hidden rather than absent. A calendar glyph beside a
date is unambiguous to anyone who can see it and silent to anyone who cannot,
so the `dt` carries the word and the `dd` carries the glyph.

> [!NOTE] `display: contents` on the group
> Each `dt`/`dd` pair needs a wrapper for the list to be valid, and a wrapper
> would become the flex item - putting the gap between wrappers instead of
> between facts. `display: contents` lifts the pair back into the row and keeps
> the nesting intact.

## The shot is eager

The picture is the largest thing above the fold, which makes it the Largest
Contentful Paint element on every page that has one. It is `fetchPriority`
high and never lazy, and the frame carries an `aspect-ratio` so the box exists
before the bytes do.

The sources are a `srcset` with `w` descriptors, taken at the three widths in
`devices.md`. A phone that downloads the laptop capture has paid for four
times the pixels it can show.
