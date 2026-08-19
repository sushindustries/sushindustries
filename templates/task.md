<!-- template
target: apps/web/content/tasks/{slug}.md
tokens: slug, title, date
-->
---
title: {title}
summary:
# Where the work lands. Free text, but reuse an existing one where you can -
# `area:` is what the collections group on, and a one-off area is a collection
# of one.
area:
# todo, doing, or done. Nothing enforces the order; this is a note to whoever
# picks it up next, including the version of you that has forgotten.
status: todo
# s, m or l. Not hours - an estimate in hours is a promise, and this is a sort
# key. `s` is an afternoon, `m` is a day, `l` is a week and probably wants
# splitting into three `m`s before anybody starts.
effort: m
# Lower comes first inside an area. Ties are fine; the sort is stable.
order: 50
draft: false
---

One paragraph on what this is and why it is worth doing. Not what it would be
called or where the files go - the *reason*, which is the part that is
expensive to reconstruct in three weeks and the part that decides whether it
still matters by then.

## What it touches

The packages, the routes, the tables. Enough that somebody picking this up
knows whether it is a contained change or one that ripples.

## Done means

The check that proves it. A command that passes, a page that renders, a
request that answers - something observable, not "the feature works". A task
whose completion cannot be observed is a task that gets called finished twice.

## What it is not

The neighbouring work this deliberately excludes, so the scope does not grow
while nobody is looking.
