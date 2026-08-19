---
title: Guides
summary: Using Icon well, and the mistakes that look like it is broken.
---

The Guides tab is for the things that are true after it works. If it belongs in
"how do I install this", it goes in Get Started; if it is a prop table, it goes
in API.

## Composing it

Drop it next to text and it matches that text: `currentColor` for stroke,
`size` set in pixels rather than in `em` so a heading and a caption can both
ask for exactly the glyph size they want without inheriting the wrong one.
There is no default background or padding - a tile around an icon (the
"chip" look in `Item` or the nav panel) is the parent's CSS, not this
component's.

## When not to use it

Every glyph renders `aria-hidden="true"` and `focusable="false"` - on
purpose, because every icon in this set is meant to sit beside its own text
label. Reach for a labelled control instead of a bare `Icon` wherever the
glyph is the only content: a close button with no visible "Close" text needs
`aria-label` on the button itself, not on the icon inside it.
