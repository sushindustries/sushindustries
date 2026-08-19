---
title: Author skills in the studio
summary: Skills are the highest-value documents here - they are what an agent loads before changing anything - and editing one means finding it in `.
area: studio
status: todo
effort: m
order: 90
draft: false
---

Skills are the highest-value documents here - they are what an agent loads
before changing anything - and editing one means finding it in
`.claude/skills` by hand. The studio can already edit documents, and a skill
is a document.

## What it touches

The skills collection surfaced as its own studio view, with the frontmatter a
skill needs validated on save.

## Done means

A skill edited in the studio is loadable by the runtime afterwards, which
means its frontmatter survived the edit.

## What it is not

Not a skill *runner*. Writing one and invoking one are different jobs.
