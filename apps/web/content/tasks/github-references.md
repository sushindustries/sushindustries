---
title: Mirror the GitHub API reference
summary: The reference index covers thirty-five providers and not the one the write path actually calls.
area: docs
status: todo
effort: s
order: 110
draft: false
---

The reference index covers thirty-five providers and not the one the write
path actually calls. Every question about the Git Data API means a web search.

## What it touches

GitHub's REST documentation added to `stack.yaml` and sharded by `pnpm
sushindustries refs` like the rest.

## Done means

`find-reference` answers a question about the trees endpoint without leaving
the repository.

## What it is not

Not the whole of GitHub's documentation. The index stores links and titles,
never page content - that boundary is what makes mirroring it safe.
