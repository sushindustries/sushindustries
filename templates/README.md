# templates

The files a new thing starts as.

Every content type on this site is Markdown with a frontmatter block, and every
catalogue reads that block by name. Which means the answer to "what do I have
to write for a post" is not in anyone's head - it is the frontmatter keys
`posts.catalogue.ts` reads, and `pnpm run doctor` fails if a file is missing one.

These templates are the same information in the form you actually need it in:
a file to start from.

## Shape

A template is a Markdown file whose first block is an HTML comment:

```md
<!-- template
target: apps/web/content/posts/{slug}.md
tokens: slug, title
-->
---
title: {title}
date: {date}
summary:
---

Body.
```

The comment names where the rendered file goes and which `{tokens}` it takes.
It is stripped on render, so what follows it is exactly the output - open a
template and you are looking at the thing it makes, not at a description of it.

`{token}` substitution is the whole templating language. There are no
conditionals and no loops, on purpose: a template that can branch is a program,
and a program that writes files wants tests, and at that point it is cheaper to
write the file.

## Using them

```bash
pnpm new post my-post-slug        # renders templates/post.md
pnpm new component my-component   # component source, docs, registry entry
pnpm new package my-package       # a workspace, its manifest and README
```

Then `pnpm run doctor` tells you what the scaffold could not know - a description
nobody has written, a demo that does not exist yet.

## Adding a template

Drop a `.md` in here with a `template:` header. `pnpm run doctor` checks the header
parses and names a target; nothing else has to be told it exists.
