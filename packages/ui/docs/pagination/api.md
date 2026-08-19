---
title: Pagination API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `page` | `number` | - | 1-based. |
| `pageCount` | `number` | - | Total pages. One or fewer renders nothing - a single page is not a choice. |
| `hrefFor` | `(page: number) => string` | - | Builds the href for a page number; the host's router owns the URL shape. |
| `renderLink?` | `(props: { page: number; href: string; className: string; "aria-current"?: "page"; "aria-label"?: string; "data-dir"?: "next"; children: ReactNode; }) => ReactNode` | - | Rendered around every href, so a router can own navigation. `page` is the number the link leads to, passed alongside the resolved href because a typed router builds its link from a route pattern and params, not from a path that has already been flattened into a string. |

<!-- /generated:api -->

## Notes

`hrefFor` is required even when `renderLink` is supplied - `renderLink` wraps
the anchor, it doesn't build the URL. Its `page` argument is the destination
page number rather than the current one, so a typed router can build `Link`
from a route pattern instead of re-parsing a resolved path.

Nothing clamps `page` to `1..pageCount`. Pass a `page` outside that range and
the component doesn't correct it - the previous/next chevrons still compute
from it, so a caller with a stale `page` value gets links to pages that don't
exist rather than a fallback to the nearest real one.
