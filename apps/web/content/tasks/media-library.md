---
title: A media library
summary: Every image on the site is a file somebody put in `public/` by hand.
area: content
status: todo
effort: l
order: 50
draft: false
---

Every image on the site is a file somebody put in `public/` by hand. There is
no record of what is used where, what a file weighs, or which uploads nothing
references any more.

## What it touches

An index of assets with their dimensions and weight, a studio section to
browse it, and an upload path that writes through the same writers documents
use.

## Done means

An unreferenced asset is findable, and an upload lands as a commit on the
studio branch like every other write.

## What it is not

Not a CDN. Railway already serves `public/` behind one; this is the index, not
the delivery.
