---
title: A skill for the studio API
summary: The API is documented at its own root and in comments, and neither is what an agent reads before using it.
area: docs
status: todo
effort: s
order: 100
draft: false
---

The API is documented at its own root and in comments, and neither is what an
agent reads before using it. There is no skill covering the write path, which
is the half where a mistake commits.

## What it touches

One skill covering the REST verbs, the dry-run default, the sha check on
edits, and the branch commits land on.

## Done means

The skill names the `?apply=true` default and the sha refusal, because those
are the two things an agent gets wrong first.

## What it is not

Not a copy of the endpoint descriptions. A skill says when to reach for
something and what it costs.
