---
title: Home desk
summary: What is on the machine drawn on the front page. One line per icon, and the extension decides what the icon is.
updated: 2026-08-17
---

# Home desk

A desk is a Markdown list, and **the extension on each line decides what the
line is**. Nothing here is registered in code: drop a file in
`content/desks/`, point a `device` block at it by name, and it is on the
screen.

```md
<!-- ::start:device from="home" kind="laptop" title="SUSHINDUSTRIES" -->
<!-- ::end:device -->
```

## The extensions

| Written | Becomes | Opens |
| --- | --- | --- |
| `assistant.app` | An app icon | The named app, in a window |
| `components.folder` | A folder | Its nested children |
| `[Label](/href)` | A link | The page, as a link |

Indent under a `.folder` to put things inside it. A folder with nothing in it
is dropped rather than drawn, because an empty folder is a promise the desk
cannot keep.

The backticked word is a glyph from `packages/ui/glyphs.md`. Leave it off and
a folder gets the folder glyph and everything else gets the file glyph, which
is right often enough to be the default.

## The desk

- assistant.app `terminal` - Ask about this site
- components.folder `layers`
  - [Button](/components/button)
  - [Card](/components/card)
  - [Device](/components/device)
  - [Typed Mark](/components/typed-mark)
- packages.folder `package`
  - [atoms](/packages/atoms)
  - [ui](/packages/ui)
  - [assistant](/packages/assistant)
- [Writing](/posts) `note`
- [Elsewhere](/p/socials) `share`
