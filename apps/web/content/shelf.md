---
title: Shelf
summary: The folders on the laptop's desktop. Editing this file changes what is in them.
---

# Shelf

Everything on this site, as folders on a desktop.

The folders are named after what is in them rather than after the furniture of
a desktop. Applications, Projects, Documents and Downloads read as a machine
and told you nothing: a folder called Documents in a portfolio is a folder
whose contents you have to open it to learn. Components, Packages, Writing and
Machine readable are longer and are answers.

Machine readable is the one worth keeping distinct. `llms.txt`, `sitemap.xml`
and `robots.txt` are not pages that happen to be files - they are the whole
surface a crawler or a model sees, and grouping them with downloads would file
the SEO layer under a verb.

## Format

Same as `nav.md`, one level deeper: a top-level item is a folder on the
desktop, its children are folders inside the window, and their children are the
things themselves. Indentation is the nesting, which is what a Markdown list
already means.

```text
- [Folder](/href) `icon` - description
  - [Subfolder](/href) `icon` - description
    - [Thing](/href) `file` - description
```

Leave the backticked glyph off and a folder gets the folder glyph and a leaf
gets the file glyph, which is right almost always. On this desktop every
top-level entry leaves it off on purpose, because a desktop where every icon is
different is not a desktop, it is a toolbar.

`{components}`, `{packages}`, `{posts}` and `{files}` are expanded by the
catalogue from the registry, the workspace and the routes. Writing them out
here would be a second copy of a list, and the first thing that goes wrong with
a second copy is a folder that opens onto nothing.

## The shelf

- [Components](/components) - Installable, grouped by what they do
  - {components}
- [Packages](/packages) - Published from this monorepo
  - {packages}
- [Writing](/posts) - Notes on how this is built
  - {posts}
- [Machine readable](/llms.txt) - What a crawler or a model reads instead of the pages
  - {files}
