---
title: Accordion
summary: details, stacked - every behaviour ships in the element, and items open independently on purpose.
updated:
---

Accordion renders a list of `<details>` elements, one per item, each opening
independently of the others. Reach for it when a page has several expandable
panels - an FAQ, a settings group - and more than one might need to stay open
at once. Reach for Collapsible instead for a single expandable line in prose.

<!-- ::start:showcase demo="accordion" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Every behaviour - toggle, keyboard, screen-reader announcement, find-in-page
opening the right panel - ships in `<details>` itself, which is why this
component is markup and a chevron and nothing else. Items open independently
on purpose: an accordion that closes its neighbours when one opens is a radio
group wearing a disclosure costume, and it hides content a reader already
chose to see.

## What it does not do

It takes no callback for open state and no controlled `open` prop past the
first render. `defaultOpen` seeds which ids start open; after that, each
`<details>` runs itself. An accordion that needs to know what is open, or
force an item shut from outside, needs different plumbing than this one.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
