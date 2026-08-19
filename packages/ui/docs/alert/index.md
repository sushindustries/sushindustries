---
title: Alert
summary: The Markdown callout, reachable from JSX - application news in the same box the docs already use.
updated:
---

Alert is the Markdown callout (`> [!NOTE]`) usable from JSX, for
application-state news - a failed save, a quota warning - that is not
authored in a Markdown file. Give it a `tone` of note, tip, or caution; `live`
makes it announced to screen readers as an interruption.

<!-- ::start:showcase demo="alert" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Markdown already renders `> [!NOTE]` as this exact box; Alert exists so an
application state can wear the same box without being written in Markdown
first. `role="alert"` is opt-in through `live` rather than the default,
because most alerts are read in place as part of the page, and a page full of
assertive regions is a page that never stops talking to a screen reader.

## What it does not do

It does not dismiss itself, queue, or stack. It renders while its condition
is true and disappears when the caller stops rendering it - timing and
dismissal are the host's job, the same way the failed save or the quota is.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
