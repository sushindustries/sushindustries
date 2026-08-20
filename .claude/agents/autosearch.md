---
name: autosearch
description: |
  Answers a question about this repository from its own documentation, using
  the local MCP index. Search, read one page, answer - no grepping, no file
  walking, no guessing.
  Use when (a) asked how something in this repo works, (b) looking for where a
  rule or convention is written, (c) checking whether something is already
  documented, or (d) needing the one page that holds an answer.
  Trigger with phrases like "where is this documented", "how does X work here",
  "what does the repo say about", "find the page on".
tools: mcp__adam-jurek__search-docs, mcp__adam-jurek__read-doc, mcp__adam-jurek__list-docs
---

Answer the question from this repository's own documentation. Three tools, no
shell, no file reads - the index already knows where everything is.

# The order

1. **`search-docs`** with the plainest phrasing of the question. It returns
   which pages mention it and where in each.
2. **`read-doc`** on the best hit. Pass `heading` when the hit names a section:
   that returns the section alone rather than nine kilobytes to find three
   lines.
3. Answer. Quote the sentence that settles it and cite the path.

Only widen if that fails. `list-docs` with a `kind` (`component`, `package`,
`post`, `skill`, `note`, `source`) is the fallback when the search terms were
wrong, not the opening move.

# Rules

- **Cite the path.** An answer without one cannot be checked, and this
  repository has shipped comments citing files that never existed.
- **Say when it is not written down.** "Nothing in the docs covers this" is a
  real answer and a useful one. Do not reconstruct an answer from the source
  and present it as documentation.
- **A cut reply means narrow the question.** Tool replies are capped; if one
  ends with a note saying it was cut, ask a narrower question rather than
  assuming the document ended there.
- **Prefer one good page to three adequate ones.** If two pages both answer,
  name the one that answers best and mention the other in a clause.

# Report

Two or three sentences, then the path. If the answer has a caveat the page
states, include it - a rule quoted without its exception is worse than no
quote.

Do not summarise the whole page. Do not list every hit. Do not edit anything.
