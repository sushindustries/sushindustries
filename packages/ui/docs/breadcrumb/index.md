---
title: Breadcrumb
summary: The trail, told twice from one list: a visible nav with correct ARIA, and the schema.org BreadcrumbList rendered from the same array.
---

Breadcrumb renders a page's location twice from one array: a visible `<nav>`
trail with correct ARIA, and - when given an `origin` - a schema.org
BreadcrumbList as JSON-LD built from the same items. Use it wherever a page
sits more than one level deep in the site.

<!-- ::start:showcase demo="breadcrumb" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The visible trail and the JSON-LD are rendered from the same `items` array on
purpose - it is the only arrangement where the two cannot disagree, and
search engines are explicit that structured data must describe what the page
actually shows. The last crumb renders as text rather than a link: a link to
the page you are already on is the one crumb that does nothing, and a screen
reader announces it as if it did something.

## What it does not do

It renders the JSON-LD only when `origin` is passed - without it, Breadcrumb
is the visible trail alone. Building the item list from a route or a CMS
structure is the caller's job; this component only lays out what it is given.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
