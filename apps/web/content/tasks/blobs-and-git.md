---
title: Blobs, paired with git
summary: The GitHub writer builds trees from blobs already, and nothing reuses them: every write uploads its content fresh even when the same bytes are already in the repository.
area: studio
status: todo
effort: m
order: 130
draft: false
---

The GitHub writer builds trees from blobs already, and nothing reuses them:
every write uploads its content fresh even when the same bytes are already in
the repository.

## What it touches

Content-addressed reuse in the writer, keyed on the sha the factories already
compute.

## Done means

Writing a file whose content is unchanged makes no blob, provable from the API
calls the writer issues.

## What it is not

Not a general object store. This is an optimisation of one writer, and it is
only worth having because the shas already exist.
