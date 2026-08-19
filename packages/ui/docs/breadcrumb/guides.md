---
title: Guides
summary: Using Breadcrumb well, and the mistakes that look like it is broken.
---

## Composing it

`items` should end with the current page, and that last entry should
have no `href` - the component treats any item with no `href` as the
current page, not only the last one, so a stray href on what should be
the final crumb turns it back into a link to itself. Root-first order
matters for the JSON-LD as well as the visible trail: `position` in the
structured data comes straight from array index.

## When not to use it

For a page with no real hierarchy above it - a home page, a one-off
landing page - a trail with nothing to show above the current page says
nothing useful. `Breadcrumb` already returns `null` for zero items, but a
single item with no parent to link to is better left out of the page
entirely than rendered as a trail of one.
