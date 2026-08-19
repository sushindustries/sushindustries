---
title: Input
summary: A text input, and only the drawing of one - state and labels belong to the form and to Field.
updated:
---

A single-line text field that draws only the control: border, focus ring and
sizing, with no label, hint or error state of its own. Reach for it as the
control inside `Field`, or anywhere a form needs a bare native `<input>`.

<!-- ::start:showcase demo="input" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

An input that manages its own state fights every form library it meets, so
`Input` stays to the drawing: state, validation and labels belong to the form
and to `Field`. The full native `<input>` prop surface passes through
untouched, which is what lets `type="email"` or `type="date"` work without
this component knowing anything about them.

## What it does not do

It has no invalid state of its own - the red border comes from `Field`'s
`error` prop, not from anything `Input` tracks. And it does no formatting or
parsing beyond what the browser's own input types already do; that logic
stays with whoever owns the value.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
