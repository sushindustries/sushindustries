---
title: Markdown
summary: Every syntax the renderer speaks, on one page - and the atomic CSS that styles it, visible in action.
updated: 2026-08-17
draft: false
---

This page is the renderer's own showcase. Everything below is plain Markdown
in a file on GitHub - the button above opens it - and every visual decision
comes from the atoms stylesheet. There is no page-specific CSS; what you see
is the token scale, the type utilities and the blocks, doing what they do on
every other page.

## Prose

Text sets in the body face on the paper ground. **Bold** carries weight 600,
*italics* lean, and `inline code` sits on the code material. A mention of a
component this site owns - like `Card` or `Pagination` - becomes a reference:
hover one and its own description rises, served from the same registry entry
the install commands come from.

You can also ~~cross something out~~ and it dims as well as strikes, break a
line hard with a backslash\
like that, and hang a claim on a footnote[^1] that collects itself at the
bottom of the page[^2].

> A blockquote holds somebody else's words at one remove: inset, quieter,
> still readable.
>
> > And a quote inside a quote steps in once more.

Reference-style links work too: define [the registry][registry] once, use it
anywhere in the prose.

[registry]: /components

[^1]: Footnotes render as GitHub's own markup - a ruled-off appendix with
    backlinks - styled once in atoms.

[^2]: Definition order follows first reference, so these two stay in the
    order they were used.

## Lists

Unordered, ordered, nested - each level indents by one spacing token:

- The scale is short on purpose
- Values come from tokens, never from numbers
  - `--s-1` through `--s-7` for space
  - `--t-xs` through `--t-lg` for type
- What is not in the scale is not in the design

1. Write the Markdown
2. The catalogue picks it up
3. The page exists

An ordered list may start anywhere:

7. Seventh
8. Eighth

And a task list carries its own checkboxes, accent-coloured by the theme:

- [x] Parse the Markdown
- [x] Style every element it can emit
- [ ] Run out of syntax

## Structure

Headings run six levels deep. The first three carry the site's display
scale; past that, depth becomes quieter rather than smaller and smaller:

### A third level

#### A fourth level

##### A fifth level, set as a label

A thematic break rules a section off without starting a new one:

---

That line above is `---`, rendered as the same soft rule the tables use.

## Table

Tables get the line tokens, and the delimiter row's colons set per-column
alignment - left, centre, right:

| Utility | Bootstrap says | Does |
| :--- | :---: | ---: |
| `.flex` | `d-flex` | display: flex |
| `.gap-3` | `gap-3` | gap: var(--s-3) |
| `.ms-auto` | `ms-auto` | the flex push |
| `.text-end` | `text-end` | text-align: end |

## Code

A fence with a language gets the charcoal slab and the CLI palette. Name a
file and it becomes the tab:

```tsx file=src/hello.tsx
import { Badge } from "@sushindustries/ui";

export function Hello() {
	return <Badge tone="docs">Rendered from Markdown</Badge>;
}
```

A shell fence gets the terminal glyph instead:

```shell
pnpm add @sushindustries/ui @sushindustries/atoms
```

## Callouts

> [!NOTE] The four callouts
> Note, tip, warning and caution - the same classes the parser emits, styled
> once in atoms, reused by the `Alert` component so the two boxes are one.

> [!TIP] Write pages as content
> `pnpm new page <slug>` scaffolds a file like this one.

> [!WARNING] Blocks must close
> An unclosed `::start:` block swallows the rest of the document.

> [!CAUTION] No page-specific CSS
> The moment a page needs its own stylesheet, the system has failed it.

## Blocks

Layout is content too. A grid of cards, written as comments:

<!-- ::start:grid columns="3" gap="4" -->

<!-- ::start:card title="Tokens" icon="grid" tone="layout" -->
Colour, space and type as variables. Everything else reads them.
<!-- ::end:card -->

<!-- ::start:card title="Utilities" icon="rule" tone="docs" -->
One class, one job, token values only - the Bootstrap axes, house spelling.
<!-- ::end:card -->

<!-- ::start:card title="Blocks" icon="layers" tone="content" -->
Earned names for compositions used in three places or more.
<!-- ::end:card -->

<!-- ::end:grid -->

And a live component, running - not a screenshot:

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

<!-- ::start:spacer size="6" -->
<!-- ::end:spacer -->

Even the 3D viewer is a block. The model below is the site's own mark,
loading through TanStack Query in parallel with the viewer code, and only
once you scroll near it:

<!-- ::start:viewer model="/models/logo.glb" height="380" label="Loading the mark" -->
<!-- ::end:viewer -->

## What is deliberately off

The parser can do four more things this site chooses not to use, and an
author should know they are choices rather than gaps:

| Syntax | Instead |
| :--- | :--- |
| Raw HTML (`allowHtml`) | Blocks. The parser's bounded AST is the trust boundary that makes rendering author content safe, and it stays closed |
| Autolink literals | Write the explicit `[text](url)` link |
| Setext headings | `#` headings, which the hierarchy check can count |
| Indented code blocks | Fenced blocks, which can name a language and a file |

## The point

Every element on this site has a Markdown mirror, every page is a file a
pull request can touch, and this one exists so you can see the whole
vocabulary at once. Copy it, keep the blocks you need, and delete the rest.
