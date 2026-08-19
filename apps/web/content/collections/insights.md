---
title: Insights
summary: The questions worth asking about the index, and the metric that answers each.
kind: insight
sort: path
limit: 30
draft: false
---

Each of these is a named question with one answer. They mirror collections
deliberately: a collection is a saved *filter* over documents, an insight is a
saved *question* over the same rows, and both are Markdown in `content/` whose
answer is computed when somebody asks.

The metric is a word, not a query. An insight is authored by somebody who is
not writing SQL, so `metric:` names a computation defined in
`insights.server.ts` - an open set would be a query language in frontmatter,
which is a database with worse syntax.
