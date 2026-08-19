---
title: Split the document actions
summary: `documents.
area: studio
status: todo
effort: s
order: 10
draft: false
---

`documents.actions.server.ts` is 497 lines holding five planners, which
measurement found rather than opinion: it is the largest file in the studio
and the only one with more than three functions.

## What it touches

One file per action under `documents/actions/`, each exporting one planner.
The dispatcher and the shared `Plan` type stay in an index beside them.

## Done means

`pnpm run doctor --map` shows no file in `modules/studio` over 250 lines, and
`pnpm check` passes unchanged.

## What it is not

Not a change to what any action does. This is the same code in five files, and
a diff that also changes behaviour is a diff nobody can review.
