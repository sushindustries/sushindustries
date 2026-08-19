---
title: Guides
summary: Desyncing two marks on one page, what reduced motion changes, and why the word stays short.
---

## Composing it

`typed` is `inline-flex`, so it sits mid-sentence like any inline element -
inside a heading, inside a button label, wherever a word would go. It
preserves its own spaces (`white-space: pre`), which a plain inline-flex row
would otherwise collapse.

## Two marks, one page

`offset` shifts where a mark starts in the nine-colour cycle. Two marks
beginning at the same hue read as a repeat rather than as a set:

```tsx
<TypedMark text="sushi industries" />
<TypedMark text="one class, one job" offset={4} />
```

This is the real pairing from this site's own demo: the second mark starts
four hues around the wheel from the first, so the two visibly disagree
instead of echoing each other.

## Motion and reduced motion

Under `prefers-reduced-motion: reduce` the per-character animation is
removed outright, which restores the default `opacity: 1` - the word appears
whole and in full colour immediately, rather than typing itself out. Nothing
is hidden by the preference; only the reveal is.

## When not to use it

Every character is rendered as its own DOM element, so cost scales with
length - this is for a name or a short phrase, not a sentence. And because
the visible characters are `aria-hidden`, a screen reader gets `label ??
text` instead: pass `label` whenever the spoken word should differ from the
one on screen.
