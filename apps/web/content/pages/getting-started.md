---
title: Getting started
summary: Install one component, understand what arrived, and know what happens the next time it changes.
updated: 2026-08-17
---

There is no package to adopt and no configuration step. A component is a file,
you copy it into your project, and from that moment it is your file. That is
the whole model, and everything below is a consequence of it.

## Install one thing

Every component page carries the exact command for that component. It fetches
the source from this site and writes it into your project:

```bash
npx shadcn@latest add https://www.adamjurek.com/r/button
```

Nothing is added to your dependency list by that command. What lands is the
component's own source and, when it needs them, the one or two other components
it is built from - the registry knows which, so you do not have to.

## Understand what arrived

Two things, and it is worth knowing which is which.

**The component** is now yours. Edit it, rename it, delete half of it. Nothing
will overwrite it, because nothing is watching it.

**The stylesheet** is not. Components are written against
`@sushindustries/atoms`, which is one CSS file of tokens and utilities that you
install once:

```bash
pnpm add @sushindustries/atoms
```

Every class a component uses is defined there. That is the one shared thing,
and it is deliberately the smallest possible shared thing: a stylesheet has no
runtime, no build step and no version of React it cares about.

## What happens when it changes

Nothing, until you ask. There is no update command that reaches into your
project, because the component stopped being mine the moment you installed it.
If a component here improves, you can run the add command again and take the
new copy - which will overwrite your edits, and that is why the version is on
every page.

This is the trade the whole library makes: you give up automatic updates and
you get code you can actually read and change. For a button, that is the right
trade. For a date library, it would not be.

<!-- ::start:questions heading="Common questions" -->

- Do I need to install the whole library to use one component?
- What is the difference between the components and the atoms package?
- If I edit a component I installed, what happens when it is updated here?

<!-- ::end:questions -->
