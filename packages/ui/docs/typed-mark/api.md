---
title: Typed Mark API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `text` | `string` | - | The word. Rendered per character, so keep it short. |
| `offset?` | `number` | `0` | Where in the colour cycle to begin. Two marks on one page starting at the same hue read as a repeat rather than as a set, and this is what makes them differ without a second palette. |
| `className?` | `string` | - |  |
| `label?` | `string` | - | What a screen reader announces. Every character is its own element here, and left alone a screen reader would spell the word out. The characters are hidden and this is read instead, so the mark is a word to everybody. |

<!-- /generated:api -->

## Notes

The nine colours are `--syn-*`, the CLI's own palette, checked against
`--code-bg` rather than against the page ground - all nine clear 4.5:1 there,
where the page's accent colour manages 2.71:1. Using this mark somewhere
other than the terminal slab it was designed for risks lower contrast than
the palette promises.

`className` is appended after the built-in `typed` class, so it can add
spacing or positioning but cannot usefully override the per-character colour
rules - those are keyed to `nth-child`, not to a class the wrapper carries.
