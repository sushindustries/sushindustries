---
title: Blog Layout
summary: A blog front page built entirely from Markdown blocks - copy this file, replace the words.
updated: 2026-08-17
draft: false
---

This page is a template. Everything on it is Markdown and the block layer -
no JSX, no route of its own - so building a blog front page is copying this
file into `content/pages/` and replacing the words. The images are Unsplash;
swap the URLs for your own.

![A desk with a notebook and a coffee, where writing allegedly happens](https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&q=70)

## Featured

<!-- ::start:grid min="18rem" gap="4" -->

<!-- ::start:card title="The one about shipping" href="/posts" meta="8 min" image="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=60" -->
The lead paragraph of the featured post, one or two sentences, ending before
it gets comfortable.
<!-- ::end:card -->

<!-- ::start:card title="Notes on typography" href="/posts" meta="5 min" image="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=60" -->
Why the scale is short, and what that buys at every width.
<!-- ::end:card -->

<!-- ::start:card title="A field guide to tokens" href="/posts" meta="12 min" image="https://images.unsplash.com/photo-1550439062-609e1531270e?w=800&q=60" -->
One palette, two themes, zero literals below the tokens layer.
<!-- ::end:card -->

<!-- ::end:grid -->

<!-- ::start:spacer size="7" -->
<!-- ::end:spacer -->

## Everything else

<!-- ::start:grid min="16rem" gap="3" -->

<!-- ::start:card title="Older post" href="/posts" meta="Mar 2026" icon="note" tone="content" -->
One line of what it argued.
<!-- ::end:card -->

<!-- ::start:card title="Another one" href="/posts" meta="Feb 2026" icon="note" tone="content" -->
One line of what it found.
<!-- ::end:card -->

<!-- ::start:card title="The archive" href="/posts" meta="All" icon="folder" tone="layout" -->
Every post, by date.
<!-- ::end:card -->

<!-- ::end:grid -->

> [!TIP] How this page works
> `grid` lays out the columns, `card` draws each entry - `image` makes the
> image card, `icon` + `tone` the category card - and `spacer` holds the
> sections apart on the spacing scale. All of it is atomic classes underneath.
