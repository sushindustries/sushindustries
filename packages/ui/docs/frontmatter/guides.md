---
title: Guides
summary: Using Frontmatter well, and the mistakes that look like it is broken.
---

## What it actually parses

```yaml
title: "Shipping a changelog"
draft: false
tags: [release, writing]
# a comment, ignored
```

`key: value` and inline `[a, b]` lists, both on one line. Quotes around a
value (single or double) are stripped; everything else is read as a plain
string, including `false` and `12` - there is no type coercion, so
`readString(meta, "draft")` gives back the string `"false"`, not a boolean.

## Why it stops there

This is deliberately not a YAML parser: no anchors, no nesting, no block
scalars.

```yaml
title: &ref Anchors
subtitle: *ref     # not read - this is a plain string "*ref"
nested:
  key: value       # not read - nesting is not walked
```

Content files in this repo only ever need flat keys and flat lists, and
`@tanstack/markdown` already stops handing back structure at the same
boundary. The honest fix for a file that needs more is a real YAML parser,
not teaching this one another feature at a time until it is a worse one.
