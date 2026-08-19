---
title: Spacer API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `size?` | `Space` | `5` | A step on the spacing scale. |
| `rule?` | `boolean` | - | Draw a hairline in the middle of the gap. |
| `label?` | `string` | - | An optional caption sitting on the rule. Implies `rule`. |

<!-- /generated:api -->

## Notes

`label` implies `rule` - passing a `label` draws the hairline whether or not
`rule` is also set, because a caption with nothing to sit on reads as a
mistake. There is no way to show a label without the rule underneath it.
`rule={true}` with no `label` draws a plain hairline and no text, which is
the setting a Markdown `---` reaches for without meaning a document
section break.
