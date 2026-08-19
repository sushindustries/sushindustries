---
title: Typography
summary: The type scale as components: Heading with outline and size separated, the Label eyebrow, the Lead. One decision, made once.
updated:
---

The type scale as four components instead of memorised class names: `Heading`
(with its outline level and visual size kept separate), `Label` for the
eyebrow above a section, `Lead` for the paragraph under a title, and `Text`
for body copy elsewhere. Reach for these instead of an ad-hoc `<p>` with a
font-size class.

<!-- ::start:showcase demo="typography" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The scale itself already lived in atoms, as CSS variables and classes. What
kept going wrong wasn't the scale - it was the reaching for it: every page
re-decided which class a heading takes, and whether the eyebrow above it is a
`Label`. These four components make that decision once, so a page built from
them can't disagree with the next one about what a title is. `as` and `size`
are separate for the same reason: the outline is for screen readers and the
doc aside, and it breaks the moment a page picks `h3` just because it wanted
the smaller font.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
