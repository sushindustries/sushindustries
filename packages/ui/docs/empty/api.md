---
title: Empty API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `string` | - | What there is none of, stated plainly. |
| `children?` | `ReactNode` | - | The way out: why it is empty, or what to do about it. |
| `icon?` | `IconName` | `"folder-open"` | The glyph above the title. Always drawn - a bare empty state reads as a failed render. |
| `action?` | `ReactNode` | - | Usually a Button. |

<!-- /generated:api -->

## Notes

`icon` cannot be turned off - there is no `null` or `false` value that
removes it, only a different glyph. A blank empty state with no icon at all
was tried and reads as a failed render rather than a deliberate one, which is
why the prop has a default instead of being optional in effect.
