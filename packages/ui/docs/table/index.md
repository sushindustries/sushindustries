---
title: Table
summary: A table that is a table: declared columns, right-aligned numbers, sideways scroll in its own frame.
updated:
---

A table that renders a plain `<table>` from a declared column list: header
text, a renderer per row, and optional right alignment for numbers. Reach for
it whenever data needs to line up in rows and columns - a pricing grid, a
changelog, package files - and sorting or selection can stay on the page.

<!-- ::start:showcase demo="table" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

Columns are declared once, each with its own renderer - that's as far toward a
data grid as this goes. Sorting and selection are the page's state; a table
that owns them becomes a component that owns your data flow instead of just
rendering it. The frame carries `data-lenis-prevent`, so a drag that starts
inside a wide table scrolls the table sideways in its own frame instead of the
page moving underneath it.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
