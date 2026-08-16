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

## Routing stays yours

`renderLink` gets `kind` and `id` alongside a plain `href`:

```tsx
renderLink={({ kind, id, className, children }) =>
	kind === "item" ? (
		<Link to="/components/$slug" params={{ slug: id }} className={className}>
			{children}
		</Link>
	) : (
		<Link to="/components" search={{ category: id }} className={className}>
			{children}
		</Link>
	)
}
```

> [!CAUTION] A typed router needs the pattern, not the path
> This is why `kind` and `id` exist rather than just `href`. Handing TanStack
> Router's `Link` an already-resolved `/components/reveal` produces an anchor
> with the right href whose click is intercepted and then silently fails to
> match `/components/$slug` - so every card looks like a link and does
> nothing. Seven of ten cards did exactly that before the callback carried the
> parts instead of the result. `href` stays for hosts that just want an anchor.

## The schema earns its place

`parseArchive` does one thing Zod cannot express: it checks that every item's
category was declared.

That is the failure worth catching, because it is invisible. An item pointing
at a category nobody declared is filtered out of every view, renders nowhere,
and produces no error at all - it simply is not in the list, and the list looks
fine.

## Cards are the same shape regardless of content

Previews are 16:9 and clipped, centred in their frame. Without that, a grid of
ten components is ten screenshots of different sizes rather than a set, and the
eye reads the variation as meaning something.

`previewSrc` is optional, because not everything is visual: a frontmatter
parser has nothing to show, and a card that insists on a picture would invent a
meaningless one. Items without it get their `preview` sentence instead, which
is also what a screen reader gets for the ones that do.

## Where this is used

| Where | Listing |
| --- | --- |
| `/components` | every registry item, filtered by the `category` search param |
| `apps/web/src/routes/components/index.tsx` | maps the registry onto this component's shape |

The mapping is a few lines and deliberately not shared. The registry knows
about files and dependency versions; the archive knows about a title, a group
and a picture. Keeping them apart is what lets this list things that are not
packages.
