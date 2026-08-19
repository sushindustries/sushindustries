<!-- template
target: apps/web/content/collections/{slug}.md
tokens: slug, title, date
-->
---
title: {title}
summary:
# The filter. Every field is optional, and leaving them all off matches
# everything - which is a collection called "all documents", and occasionally
# what you want.
#
# kind      one of: component, package, post, page, desk, skill, note, repo, source
# section   for component docs: index, get-started, guides, api, examples
# search    substring over title, summary, path and body
kind:
section:
search:
# How the members come back. `sort` is one of path, title, kind, tokens, words,
# syncedAt; `direction` is asc or desc; `limit` caps what is carried, never what
# is counted.
sort: path
direction: asc
limit: 50
draft: true
---

One paragraph saying what this collection is *for*. Not what matches it - the
filter above already says that, and a summary that restates it goes stale the
moment the filter changes.

The useful thing to write here is the judgement: why these documents belong
together, when somebody should read them, and what they will know afterwards
that they did not before.

## What this is not

A collection is a saved question, not a saved answer. Membership is computed
when somebody asks, so a document added next month joins this automatically if
it matches - and nothing has to be edited here for that to happen.

That is also the constraint. If the set you want cannot be described as a
filter, it is not a collection: it is a list, and a list belongs in prose where
somebody can see who wrote it and why.

Set `draft: false` when the filter returns what you meant. Drafts are readable
by id and absent from every listing.
