---
title: TanStack Form for the studio's forms
summary: The studio's forms are `useState` per field with the validation living in a Zod schema the form never sees.
area: studio
status: todo
effort: m
order: 60
draft: false
---

The studio's forms are `useState` per field with the validation living in a
Zod schema the form never sees. The schemas are already written; nothing
connects them to the inputs.

## What it touches

TanStack Form bound to the existing `.schemas.ts` files, so a field's
validation is the same object the server function parses with.

## Done means

Submitting an invalid form shows the message the server would have returned,
without a round trip - and the server still parses, because a client check is
a courtesy.

## What it is not

Not a form library for the site. The public pages have one form and it posts
to `/api/feedback`.
