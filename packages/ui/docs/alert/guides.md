---
title: Guides
summary: Using Alert well, and the mistakes that look like it is broken.
---

## Variants

`tone` selects a modifier class - `markdown-alert-note`, `-tip` or
`-caution` - rather than a `data-*` attribute like most toned components
here. That is deliberate: `> [!NOTE]` blocks in Markdown are parsed into
these exact class names already, and `Alert` exists so JSX-rendered news
wears the identical box. Matching the parser's own classes is what keeps
the two indistinguishable on the page.

## Composing it

`Alert` has no minimum height or width - it sizes to its parent and wraps
its own text. Leave `live` unset for anything that is page furniture (a
permanent notice, documentation content) and set it only for state that
just happened - a save that failed, a quota just hit - because
`role="alert"` interrupts a screen reader mid-sentence, and a page with
several of them announcing at once talks over itself.
