---
title: Typography API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `as?` | `HeadingTag` | `"h2"` | Position in the document outline. |
| `size?` | `"h1" \| "h2" \| "h3"` | - | Visual size, defaulting to the tag's own. |
| `children` | `ReactNode` | - |  |

### LabelProps

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `icon?` | `IconName` | - | A glyph before the words. An eyebrow is four or five uppercase characters at the smallest size on the page, which is the hardest thing on it to scan. A glyph gives the section a shape that is recognisable before the word is read, and on a page of several sections that is the difference between a list of headings and a set of places. Optional, because an eyebrow with nothing meaningful to draw is better with no glyph than with a decorative one. |

### LeadProps

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |

### TextProps

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `size?` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Body sizes from the scale. |
| `tone?` | `"default" \| "dim" \| "faint"` | `"default"` | How loud: default ink, dimmed, or faint. |
| `inline?` | `boolean` | - | Render as a span for inline use. |

<!-- /generated:api -->

## Notes

`Heading`'s `size` defaults to whatever `as` is - passing `as="h4"` with no
`size` renders at the `h4` visual scale. Set `size` only when the tag and the
look need to disagree.

`Label`'s `icon` is rendered with `aria-hidden="true"` unconditionally: it is
decoration next to a word a screen reader already gets from `children`, and
announcing both would read the section name twice.

`Text`'s `tone` and `size` are independent scales - `tone="faint" size="lg"`
is a real combination, not a contradiction. There is no `tone` on `Heading`
or `Lead`; a heading is always full ink and a lead is always dimmed, because
neither has needed a second reading yet.
