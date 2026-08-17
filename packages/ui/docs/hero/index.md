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
