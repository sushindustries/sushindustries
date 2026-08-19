---
title: Questions API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `heading?` | `string` | - | What to call the list. A heading rather than a hard-coded string because "Common questions" and "Try asking" are different promises. |
| `questions` | `readonly string[]` | - | Empty renders nothing, heading included. Each question is its own key, so duplicates collide. |
| `onAsk?` | `(question: string) => void` | - | Put the question to something that can answer it. Given this, each entry is a button; without it, a list item. |
| `level?` | `2 \| 3 \| 4` | `2` | Heading level, so the page outline stays correct. Defaults to `h2`. |

<!-- /generated:api -->

## Notes

`onAsk` is the only thing that changes what renders - given it, each question
is a `<button>`; without it, a `<span data-static="true">`. There's no prop
to force one or the other independently of whether a handler exists.

`questions` is keyed by its own string, so two identical questions in one
list collide and React only renders one. That's a content mistake to fix in
the list, not something to route around with an index key.
