---
title: Templates
summary: What `pnpm new` writes from - each one a working preview of its own output.
kind: template
sort: path
limit: 50
draft: false
---

The files behind every `pnpm new`. A template is a Markdown file whose first
block is an HTML comment naming where it goes and which tokens it takes; the
comment is stripped on render, so opening `templates/post.md` is looking at a
post.

Read one before writing a file of that kind by hand. The whole reason they
exist is that the scaffolder also does the bookkeeping nobody remembers - the
barrel export, the registry entry, the Dockerfile line - and a file written
around a template rather than from it misses those silently.
