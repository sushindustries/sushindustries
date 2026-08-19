---
title: Documentation Layout
summary: A documentation landing page from Markdown blocks - sections, cards, a live example, install tabs.
updated: 2026-08-17
draft: false
---

A documentation front page, as a template. Like every built page it is only
Markdown and blocks, which is the point being demonstrated: the docs system
can document itself with itself.

## Start here

<!-- ::start:grid columns="2" gap="4" -->

<!-- ::start:card title="Install" href="/components" icon="download" tone="docs" -->
One command per installer. The registry serves both formats from the same
entry, so there is nothing to keep in sync.
<!-- ::end:card -->

<!-- ::start:card title="Concepts" href="/p/api" icon="book" tone="docs" -->
The three ideas everything else hangs off: tokens, blocks, the registry.
<!-- ::end:card -->

<!-- ::end:grid -->

## A live example

Documentation here shows the component running, not a screenshot of it:

<!-- ::start:showcase demo="card" height="380" -->
<!-- ::end:showcase -->

## Install

<!-- ::start:tabs -->

### TanStack

```shell
tanstack add https://www.adamjurek.com/r/tanstack/card.json
```

### shadcn

```shell
pnpm dlx shadcn@latest add https://www.adamjurek.com/r/shadcn/card.json
```

<!-- ::end:tabs -->

<!-- ::start:spacer size="6" -->
<!-- ::end:spacer -->

## Reference

<!-- ::start:grid min="14rem" gap="3" -->

<!-- ::start:card title="Components" href="/components" icon="layers" tone="layout" -->
Everything installable.
<!-- ::end:card -->

<!-- ::start:card title="Blocks" href="/components?tag=block" icon="grid" tone="layout" -->
The assembled regions.
<!-- ::end:card -->

<!-- ::start:card title="API" href="/p/api" icon="file" tone="content" -->
The read API, versioned.
<!-- ::end:card -->

<!-- ::start:card title="Agents" href="/agent-setup/prompt" icon="spark" tone="docs" -->
Setup instructions machines can execute.
<!-- ::end:card -->

<!-- ::end:grid -->

> [!NOTE] Copy this file
> `pnpm new page my-docs`, paste this in, replace the words. The blocks -
> `grid`, `card`, `showcase`, `tabs`, `spacer`, callouts - are the whole
> layout vocabulary, and every one of them is atomic classes underneath.
