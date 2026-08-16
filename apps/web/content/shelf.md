---
title: Shelf
summary: The folders on the laptop's desktop. Editing this file changes what is in them.
---

# Shelf

Everything on this site, as folders on a desktop.

The names are the ones a machine ships with, and each one holds what its name
says it holds: Applications are the things you install, Projects are the things
that are published, Documents are the things that are written, Downloads are
the files a machine can fetch. Naming them after this site's own vocabulary
would have been more accurate and less legible, and nobody needs to be taught
what Documents means.

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

- [Applications](/components) - Things you can install
  - {components}
- [Projects](/packages) - Published from this monorepo
  - {packages}
- [Documents](/posts) - Notes on how this is built
  - {posts}
- [Downloads](/llms.txt) - What a machine can fetch from here
  - {files}
