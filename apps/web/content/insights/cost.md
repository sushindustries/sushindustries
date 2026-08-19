---
title: What it costs to read
summary: Tokens per kind, largest first - the number that decides what fits in one context window.
metric: tokens-by-kind
as: chart
limit: 20
draft: false
---

The only number here that constrains anything. A model has a context window,
an agent has to decide what to load into it, and "how many files" is the wrong
unit for that decision - four hundred source files and four hundred API
sections are the same count and an order of magnitude apart in cost.

Watch the ratio rather than the total. Source being most of the weight is
expected and fine. Documentation approaching it means pages have grown past
what anybody reads in one sitting, which is the failure the word budgets in
`document-an-element` exist to prevent.
