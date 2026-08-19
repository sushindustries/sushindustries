<!-- template
target: apps/web/content/posts/{slug}.md
tokens: slug, title, date
-->
---
title: {title}
date: {date}
summary:
tags: []
draft: true
# og:image. Site-relative or absolute; unset falls back to the site mark.
image:
---

One paragraph saying what this is about, before any heading. The index shows
`summary:`; this is what someone reads once they have clicked.

## The first heading

`doc-aside` builds the on-page contents from the `##` headings in this file, so
the headings are the outline - write them as the argument, not as labels.

## Callouts and code

> [!NOTE] Callouts are GitHub syntax
> The renderer turns them into `.markdown-alert` blocks. `NOTE`, `TIP`,
> `IMPORTANT`, `WARNING` and `CAUTION` all work.

```ts
// Fenced code is highlighted at build time, so no highlighter ships to the
// browser.
export const example = true;
```

## Showing a component

Any component with a demo can be embedded, at real viewport widths:

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Layout

Markdown has no way to say "these go side by side", so there is a block for it.
Anything can go inside, including other blocks.

<!-- ::start:grid min="16rem" gap="4" -->

The left column. Columns fit as many as will fit at `min` wide and share what is
left, so this is two across here and one across on a phone without a breakpoint
deciding it.

The right column. Delete the block and these become two paragraphs, which is the
correct thing for them to degrade to.

<!-- ::end:grid -->

And a measured gap, with an optional caption on the rule. Use this rather than
`---`, which is a thematic break and puts a boundary in the outline you probably
did not mean:

<!-- ::start:spacer size="6" label="Later" -->
<!-- ::end:spacer -->

Set `draft: false` when it is ready. Drafts are excluded from the index, the
sitemap and `llms.txt`.
