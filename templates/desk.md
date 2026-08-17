<!-- template
target: apps/web/content/desks/{slug}.md
tokens: slug, title
-->
---
title: {title} desk
summary: What is on this machine. One line per icon, and the extension decides what the icon is.
updated:
---

# {title} desk

Put it on a page with the `device` block, anywhere Markdown is rendered:

```md
<!-- ::start:device from="{slug}" kind="laptop" title="SUSHINDUSTRIES" -->
<!-- ::end:device -->
```

`kind` is `phone`, `tablet` or `laptop`. Leave it off and the stylesheet
decides from the width of the window, which is usually what you want.

## The extensions

| Written | Becomes | Opens |
| --- | --- | --- |
| `assistant.app` | An app icon | The named app, in a window |
| `things.folder` | A folder | Whatever is indented under it |
| `[Label](/href)` | A link | The page, as a link |

An app's label comes from its filename, so `assistant.app` is "Assistant" and
nobody writes the word twice. The backticked word is a glyph from
`packages/ui/glyphs.md`; leave it off and a folder gets the folder glyph and
everything else gets the file glyph.

Indent one level to put something inside a folder. Two levels is the whole
depth on purpose: a desktop is icons and one folder deep, and a file tree
inside a window that opens windows is a worse version of the window.

An empty folder is dropped rather than drawn, so a folder with nothing under
it will not appear.

## The desk

- assistant.app `terminal` - Ask about this site
- things.folder `layers`
  - [Something](/components)
- [Writing](/posts) `note`
