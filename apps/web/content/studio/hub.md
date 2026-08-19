---
title: Studio
summary: What is in the repository, and what can be done to it.
# The bars on the hub chart, in order. Each line is `label: source`, where a
# source is one of:
#
#   documents           every indexed document
#   documents:<kind>    documents of one kind - component, post, skill, note…
#   collections         how many collections are defined
#   references          pages in the mirrored documentation indexes
#   views               pages anybody has opened
#
# Delete a line and the bar goes. Add one and it appears. Nothing in the code
# knows what is in this list.
chart:
  Documents: documents
  Components: documents:component
  Source: documents:source
  Skills: documents:skill
  Notes: documents:note
  Collections: collections
# What the chart is measuring. `count` is how many things; `tokens` is what
# they cost to read. `tokens` only means anything for document sources.
measure: count
draft: false
---

Everything the studio shows is a projection of this repository, rebuilt by
`pnpm sushindustries sync`. It can be older than the repository, never newer -
the header says by how much.

Nothing here is a second source of truth. A document is a file, a collection is
a file describing a filter, and every change the studio makes is a change to a
file that git can see.
