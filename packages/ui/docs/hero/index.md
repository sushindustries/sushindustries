---
title: Hero
summary: The head of a documentation page - trail, element name, version, measured facts, actions and a picture of itself.
updated: 2026-08-17
---

The top of every component and package page is this one component. Before it,
four pages assembled their own head out of a breadcrumb, an `h1`, a paragraph
and a row of chips, and all four disagreed about the order.

<!-- ::start:showcase demo="hero" height="460" -->
<!-- ::end:showcase -->

## Slots, not data

`Hero` takes React nodes for the parts that know about routes - the breadcrumb
trail and the buttons - and plain values for the parts that do not. That split
is deliberate: a component in this library must never know that this site has
a `/components` route, and a component that took a `slug` and built its own
links would know exactly that.

What it does own is the arrangement. Which things sit beside which, what wraps
first, and what the layout does when there is no picture.

## It folds by room, not by window

The two-column layout is a container query, and `Hero` puts `.cq` on itself so
there is always something to measure.

The same hero renders in the full width of a component page and inside a 22rem
phone frame in the archive. A viewport query would give the phone frame two
columns of four words each, because the window it is being viewed in is wide.

```css
@container (min-width: 52rem) {
	.hero-split[data-shot] {
		grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
	}
}
```

`data-shot` is what gates it. A hero with no picture has nothing to put in the
second column, and an empty grid track is a gutter that reads as a mistake.

## The name is written as a tag

An element in this library is a tag before it is a page, so the heading says
`<avatar>` rather than "Avatar". The brackets are dimmed, which is the whole
trick: the name stays the thing your eye lands on while the punctuation does
the work of saying what kind of thing it is.

Pages that are not elements pass `title` instead and get an ordinary heading.

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
