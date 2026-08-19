---
title: Textarea
summary: A textarea in the same clothes as Input, growing with its content where the browser allows.
updated:
---

A textarea styled like Input, using `field-sizing: content` so it grows with
what's typed wherever the browser supports it, with a `rows` fallback where it
doesn't. Reach for it for multi-line free text - a message, a description -
where the number of lines isn't known ahead of time.

<!-- ::start:showcase demo="textarea" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Textarea is a native `<textarea>` with two additions: a default of 4 rows, and
the same `field-control` class Input carries, so the two feel like siblings
rather than related-but-different controls. `field-sizing: content` does the
actual growing where the browser supports it; `rows` is what shows before
anything is typed, and the honest fallback everywhere else.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
