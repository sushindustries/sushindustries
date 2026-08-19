---
title: Typed Mark
summary: Types a word out one character at a time, cycling the syntax palette. No JavaScript, no state, and it runs with scripting off.
updated:
---

A word typed out one character at a time in the CLI's syntax colours, built
entirely in CSS with no JavaScript and no state - the markup renders once and
the animation is a stagger delay per character. Reach for it for a short name
or phrase that should feel alive without costing a re-render.

<!-- ::start:showcase demo="typed-mark" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The obvious build is a `useState` counter and a `setInterval`, which costs a
re-render per character, can't render on the server, and shows the whole word
for one frame before the effect even runs. This renders the finished markup
once and lets CSS decide when each character becomes visible, so the server
and the client agree, the animation survives JavaScript being off, and a
five-character word costs the same as a fifty-character one.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
