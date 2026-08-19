---
title: Icon API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `name` | `IconName` | - |  |
| `size?` | `number` | `16` | Matches the surrounding text size by default. |
| `className?` | `string` | - |  |

<!-- /generated:api -->

## Notes

`name` is not validated at runtime - the `IconName` union it is checked
against is generated from `glyphs.md`, so an unknown name is a TypeScript
error at the call site, never a blank glyph in production. There is no
fallback path for a name that does not exist, because one cannot reach this
component without already being one of the set.

Every icon is `aria-hidden` and takes no `title` or label prop. It is
decorative by construction, not by omission - see Guides for what that means
for accessible names.
