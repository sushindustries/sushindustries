---
title: Guides
summary: Where the questions are authored, how the block reads them, and what each prop takes.
---

## Why it is built this way

The questions are content, not configuration. They live in the Markdown of the
page they belong to, in a `questions` block:

```markdown
<!-- ::start:questions heading="Common questions" -->

- How do I install a component?
- Do I need the whole library?
- What happens when a component updates?

<!-- ::end:questions -->
```

Written as a plain Markdown list, so a page carrying this block still reads
correctly as a document, and the questions turn up in the diff of the page they
describe rather than in a table somewhere else. A question that no longer
matches the page is visible to whoever is editing the page.

The block reads the questions out of the rendered list rather than re-parsing
the source, and ignores anything that is not a list item. A stray paragraph
inside the block is a typo, and rendering it as a question would put words in
the author's mouth.

Pressing one writes to a store that the assistant reads. The two are far apart
in the tree - a block is somewhere inside a rendered document, the assistant is
mounted once in the site chrome - and threading a callback between them would
mean every route that renders Markdown knowing the assistant exists.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `questions` | `readonly string[]` | required | The questions. An empty list renders nothing at all. |
| `heading` | `string` | none | What to call the list. "Common questions" and "Try asking" are different promises. |
| `onAsk` | `(question: string) => void` | none | Put the question to something that can answer it. Without it, each entry is a list item rather than a button. |
| `level` | `2 \| 3 \| 4` | `2` | Heading level, so the page outline stays correct. |
