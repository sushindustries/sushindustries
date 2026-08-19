---
title: Showcase API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `src` | `string` | - | URL of a bare page rendering just the component. |
| `title?` | `string` | - |  |
| `code?` | `string` | - | Source of the example, shown under the Code tab. |
| `language?` | `string` | `"tsx"` | Language for the code fence. |
| `install?` | `Readonly<Record<string, string>>` | - | Install commands, keyed by installer name. |
| `installLogos?` | `Readonly<Record<string, string>>` | - | Installer logos, keyed by the same names. Their marks, quoted as images. |
| `height?` | `number` | `420` | Height of the desktop frame, which has no device height of its own. |
| `renderCode?` | `(code: string, language: string) => ReactNode` | - | Rendered code block. Passed in so this file needs no highlighter. |
| `renderStackblitz?` | `(code: string, language: string) => ReactNode` | - | Renders the StackBlitz embed for the Code tab. Passed in for the same reason as `renderCode`: this package has no business depending on the StackBlitz SDK. The host builds a project from the demo's source and hands it to the SDK; this component only decides where it goes and when it is visible. |

<!-- /generated:api -->

## Notes

Three tabs, and each one needs a pair of props before it shows at all. The
Code tab needs both `code` and `renderCode` - either alone and the tab does
not appear, because there is nothing to render or nothing to render it with.
The StackBlitz tab needs `code` and `renderStackblitz` the same way, and
shares the `code` prop the Code tab uses rather than taking its own.

`install` and `installLogos` are keyed by the same installer names -
`install.tanstack` pairs with `installLogos.tanstack`. A name present in one
and not the other still renders; it just shows a command with no mark beside
it, or a mark with nothing to run.

The Preview tab opens on Compare, not on one device width. Every width in the
row is a live iframe of the real component, not a screenshot, so "does it
work here" and "where does it stop working" are the same tab - the reader
scrolls to the second question instead of clicking to reach it.
