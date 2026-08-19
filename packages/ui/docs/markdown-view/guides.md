---
title: Guides
summary: Using Markdown View well, and the mistakes that look like it is broken.
---

## Blocks

A comment-fenced block in a Markdown file reaches a real component through
`blocks`, keyed by its name:

```text
<!-- ::start:spacer size="4" -->
<!-- ::end:spacer -->
```

```tsx
import { MarkdownView, type MarkdownBlocks } from "@sushindustries/ui";

const blocks: MarkdownBlocks = {
	spacer: ({ attributes }) => <div style={{ height: attributes.size }} />,
};

<MarkdownView source={source} blocks={blocks} />;
```

`tabs` is the one name this component reserves for itself - it is handled
before `blocks` is even consulted, so a `blocks.tabs` entry is never called.

## References

`references` turns a matching piece of inline code into a link with a hover
card, built from the reference's own `title`, `summary` and `meta` - nothing
is fetched:

```tsx
const references = {
	Showcase: {
		title: "Showcase",
		href: "/packages/ui/docs/showcase",
		summary: "Renders a component at three widths, with its source.",
	},
};

<MarkdownView source={source} references={references} />;
```

Matching is an exact string against the code span's text, so `` `showcase` ``
and `` `Showcase` `` are two different keys unless both are in the map. An
inline mention that is already inside a Markdown link is left alone - a hover
card inside somebody's chosen link would be two navigations fighting over one
word.
