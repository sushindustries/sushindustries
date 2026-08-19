---
title: Radio Group
summary: Radios in a fieldset - the one grouping screen readers announce without help.
updated:
---

A set of native radio inputs inside a `<fieldset>`, for choosing exactly one
option from a short list. Reach for it whenever the choice needs to be
visible all at once, rather than folded into a select.

<!-- ::start:showcase demo="radio-group" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

A `<fieldset>` with a `<legend>` is the one grouping screen readers announce
without any ARIA added by hand, so the group label rides on markup rather
than a prop wired to `aria-labelledby`. The shared radio `name` falls back to
a generated id when none is given, so two groups on the same page never
merge into one set by accident.

## What it does not do

It does not read well past five or six options - a `NativeSelect` covers that
case in less space. And it is single-choice by construction: more than one
answer allowed at once is `Checkbox`, not a radio no matter how it's styled.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
