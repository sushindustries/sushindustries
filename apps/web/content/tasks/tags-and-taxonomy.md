---
title: Tags, categories and subcategories
summary: Categories and subcategories exist in the registry and nowhere else, and tags are a free array nothing validates.
area: content
status: todo
effort: m
order: 40
draft: false
---

Categories and subcategories exist in the registry and nowhere else, and tags
are a free array nothing validates. Content has no taxonomy at all, so a post
cannot be grouped by anything but its kind.

## What it touches

One authored vocabulary that documents, registry items and collections all
draw from, with the doctor rejecting a tag outside it.

## Done means

A tag that is not in the vocabulary fails `pnpm run doctor`, and the same
vocabulary appears in the graph and in the MCP server.

## What it is not

Not free-text tagging. A vocabulary nobody can add to without noticing is the
entire point; an open set is what the current tags already are.
