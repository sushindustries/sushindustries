---
title: Conventions
summary: The rules this repository actually enforces, and what catches a breach.
kind: note
sort: path
limit: 50
draft: false
---

Everything under `.claude/` that is not a skill: the pipeline, the rule files,
the checklists. These are the documents that answer "where does this file go"
and "what will fail if I get it wrong".

They are separated from skills on purpose. A skill is loaded by a runtime and
has to be complete on its own; a note is read by a person or quoted by a skill,
and is allowed to assume you have the repository open.

The honest thing to know about all of them: each rule carries what enforces it,
and the useful column is the one that says `nobody`. A rule that matters and is
enforced by nobody is a check waiting to be written.
