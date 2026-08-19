---
title: Markdown View API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `source` | `string` | - | Raw Markdown. Parsed to a bounded AST, so author content cannot inject markup. |
| `blocks?` | `MarkdownBlocks` | `{}` | Custom `::start:name` blocks (written inside an HTML comment) this document may use, keyed by name. This is how a Markdown file reaches a live React component without this package having to know what that component is. |
| `references?` | `ReferenceMap` | `NO_REFERENCES` | Things this document may mention, keyed by the exact inline-code text that names them. A matching mention renders as a `Ref`: a link with a hover card carrying the target's own summary. |

<!-- /generated:api -->

## Notes

`blocks` and `references` are both maps read by exact key, not by pattern -
a name or a mention that does not match an entry falls back quietly (an
unmatched block keeps its children as prose, an unmatched mention stays
plain `<code>`) rather than throwing. A block's `attributes` are always
strings: `data-attributes` comes off the parser as JSON, but non-string
values in it are dropped, so `height="420"` in the source is `"420"` in the
block, never the number `420`.
