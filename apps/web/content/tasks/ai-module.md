---
title: Token budgets for chosen documents
summary: The index knows what every document costs and there is no way to select a set and ask what handing it to a model would cost.
area: studio
status: todo
effort: m
order: 150
draft: false
---

The index knows what every document costs and there is no way to select a set
and ask what handing it to a model would cost. That number is the one that
decides what is possible in a context window.

## What it touches

A selection in the studio that reports its total, with the same estimate the
projection stores.

## Done means

The total for a collection matches what `read-collection` reports through the
MCP server, because both read the same column.

## What it is not

Not a tokeniser. Four characters a token is an estimate, it is documented as
one, and being within twenty per cent is the whole requirement.
