---
title: Guides
summary: Using Reference well, and the mistakes that look like it is broken.
---

## Composing it

Every element inside is a `<span>`, on purpose - a reference lives inside a
paragraph, and a `<div>` inside a `<p>` is markup the HTML parser will hoist
out from under it. Nest `Ref` in running text, not as a block on its own.

## When not to use it

When the target isn't already known - `Ref` never fetches, it only displays
whatever `Reference` object it's handed. A mention that needs a network call
to resolve its title and summary belongs in a loader, not in this component.
