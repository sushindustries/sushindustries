---
title: Card API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `title` | `string` | - |  |
| `meta?` | `string` | - | Shown top-right, in the label style. A version, a date, a count. |
| `children?` | `ReactNode` | - |  |
| `href?` | `string` | - | Renders the card as a link. Omit for a plain container. |
| `as?` | `"h2" \| "h3"` | `"h3"` | Heading level, so a card can sit under the right heading. |
| `image?` | `string` | - | A picture across the top: the image card. The card supplies the frame and the crop; the image supplies everything else, which is why there is no `variant` prop - a card with an image *is* the image variant. |
| `imageAlt?` | `string` | `""` | Alt text for the image. Empty means decorative, which is the default. |
| `icon?` | `IconName` | - | A glyph on a tile beside the title: the category card. |
| `tone?` | `string` | - | Colour family for the icon tile, resolved by the stylesheet. |

<!-- /generated:api -->

## Notes

`image` and `icon` can be combined - the image bleeds across the top and
the icon tile still sits beside the title beneath it - but `imageAlt`
without `image` does nothing, since there is no `<img>` to attach it to.
`href` starting with `http` gets `target="_blank"` and
`rel="noopener noreferrer"` automatically; a relative `href` never does,
so an external link only needs the full URL to get the right behaviour.
