---
title: A pipeline tool
summary: The workflows section runs four fixed commands.
area: studio
status: todo
effort: l
order: 80
draft: false
---

The workflows section runs four fixed commands. Anything else - ask a question
about the repository, chain two steps, feed one output into the next - means
writing a script nobody else can find.

## What it touches

Pipelines authored as Markdown with their steps in frontmatter, run by the
workflows runner, and readable through the MCP server like every other
document.

## Done means

A pipeline defined in a file appears in the studio without any code change,
and its run reports each step.

## What it is not

Not a general workflow engine. Steps are things this repository can already
do; a pipeline that needs a new primitive wants the primitive first.
