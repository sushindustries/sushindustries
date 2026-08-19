---
title: Icon
summary: The glyph set, generated from a Markdown table where every drawing carries its reason. One component, typed names, no icon font.
---

Every glyph on this site comes through this one component: a typed `name`, an
optional `size`, and an inline SVG that inherits the text color around it.
There is no icon font to load and no sprite sheet to configure - the whole
set compiles into the component.

<!-- ::start:showcase demo="icon" height="220" -->
<!-- ::end:showcase -->

## Why it is built this way

**The set is written in Markdown and generated into code.** Each drawing in
`glyphs.md` sits next to the reason it exists, because a glyph without a
reason is how icon sets grow to four hundred entries nobody can name. The
generator turns that table into `icon.tsx`, and the type of `name` is the
table - a typo is a compile error, not an empty box.

**It inherits, never decides.** `currentColor` and the surrounding text size
are the defaults, so an icon dropped into a label, a button or a heading
looks like it was drawn there. `size` exists for the places that measure in
pixels on purpose.

## What it does not do

It does not take arbitrary SVGs - a glyph joins the set by joining the
table, with a reason, through the generator. And it does not ship per-icon
files: the set is one component because twenty-glyph icon systems do not
need a bundler strategy.
