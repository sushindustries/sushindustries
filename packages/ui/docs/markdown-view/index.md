---
title: Markdown View
summary: Renders Markdown with callouts, CSS-only tabs, custom blocks and highlighted code.
---

Renders a whole Markdown document - headings, callouts, CSS-only tabs, custom
blocks and highlighted code - as the template layer every content file on
this site is written against. Reach for it wherever raw Markdown, not JSX,
needs to become a page: posts, component docs, package READMEs.

<!-- ::start:showcase demo="markdown-view" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Content on this site is `.md`, not TSX, which only works if Markdown can
reach past paragraphs and lists - the docs extensions add callouts and
tabbed sections, and `blocks` lets a page map a comment-fenced block to a
live React component without this package knowing what that component is.
Parsing and syntax highlighting both run synchronously, so a whole document
renders during SSR with no client JavaScript and nothing to re-highlight on
hydration.

The parser's trust boundary is what makes rendering author content safe at
all: it emits a bounded AST rather than passing raw HTML through, so a
document cannot inject markup.

## What it does not do

An unmatched block name or reference mention is not an error - it falls back
quietly, rendering its children as plain prose or plain `<code>`. That is
deliberate but it means a typo in a block's name looks identical to the
block doing nothing.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
