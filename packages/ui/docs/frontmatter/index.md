---
title: Frontmatter
summary: A small frontmatter reader for `key: value` and inline lists. Not YAML, deliberately.
---

Frontmatter parses a Markdown file's frontmatter block for `key: value` lines
and inline `[a, b]` lists, nothing more. Reach for it to read a content
file's metadata without pulling in a YAML parser for a format that never
needs anchors, nesting, or block scalars.

<!-- ::start:showcase demo="frontmatter" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

TanStack Markdown hands back the frontmatter block as a raw string and stops
there, which is the right call for a Markdown parser, not a YAML one. This
covers only the subset content files in this repo actually use. It is
deliberately not YAML: no anchors, no nesting, no block scalars. If a file
ever needs those, the honest fix is a real YAML parser, not teaching this one
another feature at a time until it becomes a worse one.
