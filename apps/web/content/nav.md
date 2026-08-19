---
title: Navigation
summary: What is in the site header. Editing this file changes the nav.
---

# Navigation

The header is this list. There is no array in a component to keep in step with
it, which is the point: the nav is content, and content lives in Markdown here
like everything else does.

## Format

A top-level list item is an entry. Indent under one and it becomes a panel that
expands; leave it alone and it stays a plain link, which is the right answer for
most of them.

```text
- [Label](/href) `icon` - description
  - [Child](/href) `icon` - description
```

The backticked word is a glyph from `packages/ui/glyphs.md`. `pnpm run doctor`
rejects one that is not in that table, so a typo is caught rather than silently
rendering nothing.

`{categories}` in place of children expands to the component categories, each
with its own glyph and a live count, read from `packages/ui/registry.ts`.
Writing them out by hand here would be a second list of categories to keep in
step with the first.

## How many entries

Three, and it is worth writing down why rather than rediscovering it.

The header had five top-level entries opening onto twenty-three items, and two
of the five were not really categories of their own. **Blocks** was a subset of
Components - a block *is* a registry item, filtered by one field - so it read as
a second library that does not exist. **Writing** was one link sitting at the
same level as a panel of five.

Both folded into the entries they belonged to. Three panels is a header you can
read in one pass; five was a list you had to search.

The nine blocks are no longer enumerated here. They were nine rows of an
expanded panel repeating what `/components?tag=block` already lists, and a menu
that reproduces a page is a menu that goes stale the first time the page gains
a row.

## The nav

- [Components](/components) `layers`
  - {categories}
  - [Blocks](/components?tag=block) `grid` - Assemblies that stand as a whole region of a page
- [Packages](/packages) `package`
  - [All packages](/packages) `package` - Everything published from this monorepo
  - [UI](/packages/ui) `layers` - The components the site is made of
  - [Atoms](/packages/atoms) `grid` - Design tokens and atomic CSS
  - [Product Viewer](/packages/react-product-viewer) `cube` - A GLB in a React component
  - [LLMs](/packages/llms) `text` - Crawler files and a sitemap from one description of a site
- [Docs](/p/markdown) `book`
  - [Markdown](/p/markdown) `text` - Every syntax the renderer speaks and the atoms underneath it
  - [Blog layout](/p/blog-layout) `note` - A blog front page written as Markdown blocks
  - [Documentation layout](/p/documentation-layout) `book` - A docs landing page as a copyable template
  - [The read API](/p/api) `link` - Every endpoint, documented from its own catalogue
  - [Writing](/posts) `note` - Posts, when I have written any
