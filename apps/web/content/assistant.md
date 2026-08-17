---
title: Assistant
summary: What the assistant says before you ask it anything, and the questions it offers. Editing this file changes the panel.
updated: 2026-08-17
---

# Assistant

Same contract as `nav.md`, `shelf.md` and `footer.md`: the panel is content, so
it is Markdown. Nothing here is compiled into a component. Change a line, and
the terminal on the desk says something different on its next render.

Three sections, and each is read by exactly one rule.

## The greeting

The first thing in the log, before anybody has typed. One paragraph, kept to a
couple of lines, because it sits above the prompt rather than beside it and a
long one pushes the first question off the screen.

Ask about the components, the packages, or why any of this is built the way it
is. It runs on Groq and it is a language model, so it will occasionally answer
with total confidence and be completely wrong. If some code it hands you does
not run, that one is on me rather than on you. Hope it mostly behaves.

## Elsewhere

A link per line, with a glyph from `packages/ui/glyphs.md` in backticks. These
render as a row of chips under the greeting.

Keep it to three. This is a greeting, not a footer, and the footer already
lists everything.

- [Follow on LinkedIn](https://www.linkedin.com/in/adamjurek22) `linkedin`
- [Star on GitHub](https://github.com/sushindustries) `star`
- [Buy me a coffee](https://github.com/sponsors/sushindustries) `spark`

## Openers

The questions offered as pills. Pressing one sends it as though it had been
typed, so each line is written as the reader would ask it rather than as a
label.

Four at most. A wall of suggestions is a menu, and a menu is the thing a prompt
was supposed to replace.

- What can I find on this website?
- Which components can I install?
- How is the atomic CSS organised?
- Who built this?
