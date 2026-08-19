---
title: Guides
summary: Using Credit well, and the mistakes that look like it is broken.
---

## Composing it

It is built to sit in a grid or a stacked list of other `Credit` cards - a
dependencies page, an "open source used here" section - not alone. Nothing
about it requires a particular parent, but nothing about it looks finished
as a lone card either.

## Why `by` is required, not optional

A page that lists what it is built with, styled in the same visual language
as what it built, quietly takes credit for both unless the distinction is
unmissable. Making `by` required rather than optional is what stops a future
call site from rendering a card with no author - the type system enforces
the one rule this component exists for.

## When not to use it

Crediting your own work. `Credit` is for dependencies and other people's
projects; a self-referential "by" line reads as a joke or a mistake, not
attribution.
