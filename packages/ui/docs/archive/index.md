---
title: Archive
summary: A filterable grid with categories, subcategories and tags, that leaves routing to you.
---

The component museum is this, listing the registry. It knows nothing about
registries.

<!-- ::start:showcase demo="archive" height="520" -->
<!-- ::end:showcase -->

## Three kinds of grouping, on purpose

| | Filterable | Why |
| --- | --- | --- |
| Category | yes | Every item is in exactly one. An item that plausibly fits two means the categories are wrong |
| Subcategory | no | Free text, for reading. An unrecognised one costs nothing |
| Tags | yes | Cross-cutting. A tag used once gets a chip used once, which is the signal it should not have been a tag |

Categories are a partition and tags are a set. Collapsing them into one concept
is the usual mistake and it produces a filter row where "Motion" and "no-deps"
sit side by side as though they were the same kind of thing.

## The schema earns its place

`parseArchive` does one thing Zod cannot express: it checks that every item's
category was declared.

That is the failure worth catching, because it is invisible. An item pointing
at a category nobody declared is filtered out of every view, renders nowhere,
and produces no error at all - it simply is not in the list, and the list looks
fine.

## Where this is used

| Where | Listing |
| --- | --- |
| `/components` | every registry item, filtered by the `category` search param |
| `apps/web/src/routes/components/index.tsx` | maps the registry onto this component's shape |

The mapping is a few lines and deliberately not shared. The registry knows
about files and dependency versions; the archive knows about a title, a group
and a picture. Keeping them apart is what lets this list things that are not
packages.
