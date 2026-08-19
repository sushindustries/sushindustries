---
title: Guides
summary: Why the heading level and its size are two separate props, and what each of the four components is for.
---

## Outline and size are separate on purpose

`as` picks the tag - the position in the document outline that a screen
reader or `DocAside` reads. `size` picks the look. They default together
(`h2` reads as `h2`-sized), but nothing stops `as="h4" size="h2"` for a
heading that must nest four levels deep in the outline while still reading
as the page's biggest type.

```tsx
<Heading as="h3" size="h2">Section title</Heading>
```

Collapsing the two into one prop is the mistake this exists to prevent: a
page picks its `h3` because it wants the smaller font, and the outline is
wrong for anyone not reading the pixels.

## Four components, four jobs

| | Job |
| --- | --- |
| `Heading` | The title itself. |
| `Label` | The eyebrow above it: mono, small caps, quiet, an optional `icon` that is `aria-hidden` because it repeats the word beside it. |
| `Lead` | The paragraph directly under a heading: dimmed, measured, never full-bleed. |
| `Text` | Body copy anywhere else, with its own `size` and `tone`, and an `inline` flag for sitting inside a sentence rather than starting a paragraph. |

Reaching for a bare `<p>` with an ad-hoc font-size class instead of `Text` is
the drift these exist to stop - it disagrees with the next page's version of
the same idea.
