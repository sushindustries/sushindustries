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

The backticked word is a glyph from `packages/ui/glyphs.md`. `pnpm doctor`
rejects one that is not in that table, so a typo is caught rather than silently
rendering nothing.

`{categories}` in place of children expands to the component categories, each
with its own glyph and a live count, read from `packages/ui/registry.ts`.
Writing them out by hand here would be a second list of categories to keep in
step with the first.

## The nav

- [Components](/components) `layers`
  - {categories}
- [Packages](/packages) `package`
  - [All packages](/packages) `package` - Everything published from this monorepo
  - [UI](/packages/ui) `layers` - The components the site is made of
  - [Atoms](/packages/atoms) `grid` - Design tokens and atomic CSS
  - [Product Viewer](/packages/react-product-viewer) `cube` - A GLB in a React component
  - [LLMs](/packages/llms) `text` - Crawler files and a sitemap from one description of a site
- [Writing](/posts) `note`
