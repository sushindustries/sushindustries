---
title: Spacer
summary: Vertical space on the scale, optionally with a rule and a label. Built for Markdown.
---

<!-- ::start:showcase demo="spacer" height="360" -->
<!-- ::end:showcase -->

## The argument against this component

Space should come from the things being spaced. A component that sets its own
bottom margin knows how far it sits from the next thing, and a separate element
whose only job is to be empty is usually a sign that something above it is
missing a rule.

Inside a component, that argument is right, and this is the wrong tool.

## Where it is right

Markdown. An author writing a post has no markup to hang a margin on. The
alternatives are an empty paragraph, a `<br>`, or a `---`, and `---` is a
semantic thematic break that merely looks like a line - using it for spacing
puts a section boundary in the document outline that the author did not mean.

Given that something is going to be written there anyway, it may as well take a
step on the scale rather than a number somebody picked, and it may as well be
able to draw the rule a writer was reaching for.

<!-- ::start:spacer size="6" label="Like this" -->
<!-- ::end:spacer -->

That gap is a spacer with a label. The rule sits in the middle of the space
rather than at its edge, so what is above and below stays symmetric and the
spacer keeps the height it declared.

## In Markdown

```text
<!-- ::start:spacer size="6" label="Later" -->
<!-- ::end:spacer -->

<!-- ::start:spacer size="5" rule="true" -->
<!-- ::end:spacer -->
```

`size` is a step from 1 to 7. A value outside that falls back rather than
throwing, because a bad attribute in a document should not take the page down.

## Accessibility

A spacer with no label is `aria-hidden`. A gap is not content, and announcing
one is noise in a screen reader for something a sighted reader experiences as
nothing.

A spacer with a label is not hidden, because at that point it is a caption.

## Where this is used

| Where | What for |
| --- | --- |
| Any `.md` on this site | the `::start:spacer` block |
| `packages/ui/docs/nav-bar/index.md` | the labelled break before "Where it is used" |
| `templates/post.md` | in the template, so a new post starts with it available |
