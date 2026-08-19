---
title: Break up the dock
summary: The dock, the desk windows and the shelf grew together and share state through props threaded several levels deep.
area: ui
status: todo
effort: m
order: 140
draft: false
---

The dock, the desk windows and the shelf grew together and share state through
props threaded several levels deep. Each is installable on its own and none of
them is usable that way.

## What it touches

One state owner per surface, with the pieces taking what they need as props
rather than reaching for a shared object.

## Done means

Each of the three installs from the registry and renders without the other
two.

## What it is not

Not a redesign. They look right; the wiring is what does not come apart.
