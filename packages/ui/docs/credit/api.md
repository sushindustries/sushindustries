---
title: Credit API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `name` | `string` | - | The project's own name, spelled the way its authors spell it. |
| `by` | `string` | - | Who made it. Shown so authorship is never ambiguous. |
| `href` | `string` | - | The project's own home. Opens in a new tab, since it leaves this site. |
| `role` | `string` | - | What it does *here*. One line, present tense. |
| `logo?` | `string` | - | The project's own mark, as an image URL. Their drawing, not a redraw - a dependency's logo is quotation, and quotations are not paraphrased. |
| `docs?` | `string` | - | Where the documentation lives, when it is not the `href` itself. |

<!-- /generated:api -->

## Notes

`docs` is the only prop that changes the markup shape: without it, the card
is a single anchor. With it, a second anchor is laid over the corner as a
sibling rather than nested inside the first - an `<a>` inside an `<a>` is
markup the parser unnests, so the two links share a `credit-slot` wrapper
instead of one containing the other.

`logo` takes a URL, not a component: it always renders as a plain `<img>`
with an empty `alt`, since the name text beside it is already the accessible
label for what the image shows.
