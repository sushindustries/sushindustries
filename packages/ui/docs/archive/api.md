---
title: Archive API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `categories` | `readonly ArchiveCategory[]` | - | The chips, in the order given. One with no items still gets a chip, counted zero. |
| `items` | `readonly ArchiveItem[]` | - | Everything, before filtering. Category counts come from here, so they hold steady as filters narrow. |
| `active?` | `string` | `"all"` | Current category filter id, or `"all"`. |
| `activeTag?` | `string` | - | Current tag filter, if any. Narrows within the active category. |
| `hrefForCategory` | `(id: string) => string` | - | Builds the href for a filter chip. The route owns routing, not this. |
| `hrefForTag?` | `(tag: string \| undefined) => string` | - | Builds the href for a tag chip. Pass `undefined` to clear the tag. |
| `page?` | `number` | - | 1-based page within the filtered result. Absent means "no pagination". |
| `pageSize?` | `number` | `24` | Items per page when `page` is set. |
| `hrefForPage?` | `(page: number) => string` | - | Builds the href for a page number. Required when `page` is set. |
| `renderPageLink?` | `PaginationProps["renderLink"]` | - | Rendered around every page number, forwarded to `Pagination` untouched. Without it page links are plain anchors, which a client-side router does not intercept - every page click becomes a full document load. |
| `renderLink` | `(props: { kind: "category" \| "tag" \| "item"; id: string; href: string; className: string; "data-tone"?: string; children: ReactNode; }) => ReactNode` | - | Renders the link wrapper, so the host can use its router's Link. `kind` and `id` are passed alongside the plain href because a typed router needs the route pattern and its params, not a path that has already been resolved - handing `Link` a resolved `/components/reveal` gets an anchor with the right href whose click is intercepted and then silently fails to match `/components/$slug`. The href stays for hosts that just want an anchor. |
| `emptyLabel?` | `string` | `"Nothing here yet."` | Replaces the grid when the filters match nothing. The chips stay, so the reader can undo. |

<!-- /generated:api -->

## Notes

`page`, `pageSize` and `hrefForPage` are one feature, not three - pagination
is on only when `page` is set, and `hrefForPage` is required at that point
because there is no page number without a link to reach it. Leave `page`
unset for an unpaginated grid; `pageSize` and `hrefForPage` are then ignored.

`hrefForTag` works the same way for the tag row: absent, no tag chips render
at all, regardless of whether `items` carry tags. A grid that cannot link to
a tag has nothing useful to say about one.

`renderLink` is called for three different `kind`s - `category`, `tag`,
`item` - with the same shape each time. A host that only handles one kind
correctly will find the others silently rendering plain anchors or nothing,
since `renderLink` is the only thing standing between a chip and a route.
