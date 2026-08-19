---
title: Doc Nav
summary: The left rail of a documentation page - the sections of a library, the elements in each, and the one that is open.
---

The rail that says where you are. Sections come in as data, links are rendered
by the host, and the open item is marked and scrolled to. On a wide screen it
is a sticky column; below that it folds into one row above the document that
opens on tap.

<!-- ::start:showcase demo="doc-nav" height="420" -->
<!-- ::end:showcase -->

## Why the collapse is CSS

The toggle is a checkbox and a label, not React state. A reader who has landed
on the wrong element wants the next one immediately, and a control built from
state does nothing until hydration. The same markup is a static rail on a wide
screen - CSS hides the control rather than the component rendering something
different.

> [!NOTE] Collapsed on a tablet, not hidden
> The tab bar above a document only moves between that element's own sections.
> This is the one thing on the page that gets you to the next element, so it
> keeps a row rather than disappearing between 861px and 1199px.

## Scrolling, carefully

The open item is brought into view by writing `scrollTop` on the rail.
`scrollIntoView` scrolls every scrollable ancestor, so landing on an element
two thirds down the list would also scroll the document past its own title
before the reader had seen it.
