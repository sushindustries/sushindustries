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

> A blockquote holds somebody else's words at one remove: inset, quieter,
> still readable.

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

## Table

Tables get the line tokens and the mono numerals:

| Utility | Bootstrap says | Does |
| --- | --- | --- |
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

## The point

Every element on this site has a Markdown mirror, every page is a file a
pull request can touch, and this one exists so you can see the whole
vocabulary at once. Copy it, keep the blocks you need, and delete the rest.
