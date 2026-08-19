---
description: Answer a question from this repository's own documentation
---

Answer from what is written in this repository rather than from memory. Every
component has five documents - index, get-started, guides, api, examples - and
reading the one that matches the question is both faster and more likely to be
right than reading the whole page.

The question is: $ARGUMENTS

1. `search-docs { query }` when you do not know where it is written down. Add
   `kind` to stay inside component pages, package READMEs, posts or skills.
2. `list-sections { slug }` to see which of the five documents a component
   actually has before pulling one.
3. `read-doc { slug, section }` for the answer. A question about props is
   `section: "api"`; a question about composition or reduced motion is
   `section: "guides"`; a question about installing is `section: "get-started"`.

Two rules worth keeping:

- The API section is generated from the source. If it disagrees with the code,
  the code is right and `pnpm run doctor` will say so.
- Cite the path you read. A claim about this repository that names no file is
  a claim nobody can check.
