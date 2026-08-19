---
title: Credit
summary: A dependency, credited, with its author required rather than optional.
---

Credit is a card for one dependency: its own mark and name, who built it, what
it does here, and a link to its home. Reach for it on a "built with" or
dependencies page, wherever crediting the tools a project runs on needs to be
unmissable rather than implied.

<!-- ::start:showcase demo="credit" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

A page that lists what it is built with, in the same visual language as what
it built, quietly takes credit for both unless the distinction is unmissable
- so `by` is required, not optional: the type system enforces the one rule
this component exists for. The card is one anchor and the docs chip is a
second, sibling anchor laid over its corner, because an `<a>` inside an `<a>`
is markup the browser will unnest.
