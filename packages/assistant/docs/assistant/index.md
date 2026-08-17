---
title: Assistant
summary: A terminal that answers questions about this site, streaming Markdown, with its history in the browser and nowhere else.
---

It is an application on the desktop rather than a page: open **Assistant** on
the machine and it runs in a window you can drag, resize and put away.

## Why it is a terminal

Answers here are code fences, file paths and tables.

A chat bubble is a shape built for a sentence. A fenced block inside a rounded,
tinted, right-aligned bubble spends its life fighting the bubble for the
margins it needs, and loses. A prompt and a log have no such problem, and they
are honest about what this is: something you type a question into and read the
output of.

`>` is what somebody typed at and `$` is what answered. Two characters instead
of two name badges, which is most of what makes a log read as output. The words
are still there for a screen reader, which cannot tell two pieces of
punctuation apart.

The banner is three elements rather than one string, because the slashes are
punctuation and the name is the subject and they are different colours:

```tsx
<span className="term-slash">{"//"}</span>
<span className="term-mark">sushi industries</span>
<span className="term-slash">{"//"}</span>
```

> [!CAUTION] `{"//"}` and never a bare `//`
> JSX reads a bare `//` in children as the start of a comment and drops the
> rest of the line silently. The banner rendered with no slashes at all and
> nothing said so.

## The send button is outlined

A solid orange button would be the brightest thing on a dark log, pulling the
eye away from the answer, which is the only thing here worth looking at. An
outline in the same accent is exactly as findable and does not compete - it
reads as the terminal's own control rather than as a call to action pasted onto
one. It fills on hover, where a fill is doing work.
