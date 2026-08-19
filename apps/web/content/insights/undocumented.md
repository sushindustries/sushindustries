---
title: Registry items with no page
summary: Installable things whose documentation is a single sentence.
metric: undocumented
as: table
limit: 30
draft: false
---

An item in the registry with no documentation directory still renders a page -
it falls back to the registry blurb, which is one sentence written to fit on a
card. That fallback is why this is worth measuring: nothing breaks, nothing
errors, and the page looks like a page.

`pnpm new docs <slug> <section>` writes the scaffold. The doctor catches a
missing `index.md`; the other four sections are on nobody's list but this one.
