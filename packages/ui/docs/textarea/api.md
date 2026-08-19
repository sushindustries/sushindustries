---
title: Textarea API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

Accepts every prop of `TextareaHTMLAttributes<HTMLTextAreaElement>`.

<!-- /generated:api -->

## Notes

`rows` defaults to 4 when left unset, but it only sets the *starting*
height. Where `field-sizing: content` is supported, the visible height
tracks what is typed and the stylesheet's own `min-height: 4.5em` does the
same job `rows` would otherwise do - so passing a larger `rows` rarely
changes what a modern browser shows. It still matters as the fallback
height in browsers without `field-sizing` support.
