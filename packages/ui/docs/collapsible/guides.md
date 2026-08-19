---
title: Guides
summary: Using Collapsible well, and the mistakes that look like it is broken.
---

## When to use this instead of Accordion

`Collapsible` is one `<details>` with no list wrapper, for a single
aside inside prose - a "read more", a spoiler, an FAQ answer that does
not belong to a set. Reach for `Accordion` instead the moment there are
two or more related rows that should look like a group; wrapping several
`Collapsible`s by hand only recreates what `Accordion` already does,
minus the shared border between rows.
