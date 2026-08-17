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

## Where this is used

| Where | What for |
| --- | --- |
| Any `.md` on this site | the `::start:spacer` block |
| `packages/ui/docs/nav-bar/index.md` | the labelled break before "Where it is used" |
| `templates/post.md` | in the template, so a new post starts with it available |
