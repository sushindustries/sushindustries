---
title: Code Block
summary: A highlighted code slab in the CLI's colours, with a copy button that confirms in place.
updated: 2026-08-17
---

Code on this site is a terminal, whichever theme the page is in: a warm
charcoal slab that does not invert, with a lit top edge and a contact shadow so
it sits *on* the paper rather than tinting a region of it. The syntax palette
is the CLI's own xterm-256 hues, so a command pasted from the terminal into a
fence keeps its colours.

<!-- ::start:showcase demo="code-block" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Highlighting is synchronous, so a page full of these renders during SSR and
nothing re-highlights on hydration - only the copy button is live. Before this
component existed the same highlighted markup was built in two places
(`MarkdownView` for fences, the showcase block for demo source), and the copy
button would have made it three. One component, one slab, one palette.

The colours are semantic tokens - `--syn-keyword`, `--syn-string`,
`--syn-command` and friends - defined once in the stylesheet's `:root`. A shell
fence gets the deeper ground and its command in the CLI's brand orange, because
"type this" and "read this" are different asks and should read differently
before the first word does.

## What it does not do

It does not scroll its button. The copy chip sits on a `code-shell` wrapper
outside the scrolling content, so a long line scrolls under it. It does not
load grammars dynamically - the languages are the ones this site's content
uses, registered by hand in `highlighter.ts`, and adding one is a one-line,
noticeable change.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
