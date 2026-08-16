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

---

Set `draft: false` when it is ready. Drafts are excluded from the index, the
sitemap and `llms.txt`.
