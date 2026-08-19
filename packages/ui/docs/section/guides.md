---
title: Guides
summary: Using Section well, and the mistakes that look like it is broken.
---

## Composing it

`Section` already provides the `.container` padding and the `.section`
block spacing - nest another `.container` inside it and the content gets
padded twice. It's meant to be used directly as one of a page's top-level
blocks, not as an inner wrapper.

## When not to use it

For the first thing on a page. `Section` reveals its heading and body on
scroll, which means content already in view on load spends a frame invisible
before the observer fires - fine below the fold, wrong for a hero or anything
that should be there the instant the page paints.
