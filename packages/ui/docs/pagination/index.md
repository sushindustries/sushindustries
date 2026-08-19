---
title: Pagination
summary: Pages as links with first and last always reachable, and nothing that breaks middle-click.
updated: 2026-08-17
---

Numbered pages with the window everyone already knows: first and last always
visible, one page either side of the current one, an ellipsis where numbers
were elided. Links, not buttons - a page is an address, and pagination that
cannot be opened in a new tab or crawled is state pretending to be navigation.

<!-- ::start:showcase demo="pagination" height="300" -->
<!-- ::end:showcase -->

## Usage

```tsx
import { Pagination } from "@sushindustries/ui";

<Pagination
	page={page}
	pageCount={12}
	hrefFor={(page) => `?page=${page}`}
/>
```

With a typed router, hand it your `Link` through `renderLink` and it never
builds an anchor at all:

```tsx
<Pagination
	page={page}
	pageCount={pageCount}
	hrefFor={(page) => `/components?page=${page}`}
	renderLink={({ href, children, ...props }) => (
		<Link to="/components" search={{ page }} {...props}>
			{children}
		</Link>
	)}
/>
```

## Why it is built this way

The window is computed, not configured: `1, last, page ± 1`, sorted, with a
gap marker wherever two neighbours are not adjacent. A `siblingCount` option
would be a knob for a decision that has one right answer at this size.

`page` clamps rather than 404s inside `Archive`: a bookmarked page 3 of a
filter that now fits on one page shows the last page, not an empty grid.

## What it does not do

It does not own the URL shape - `hrefFor` does, so `?page=3`, `/page/3` and a
typed router's search params all work without this component knowing which.
It renders nothing at one page, because pagination for one page is furniture.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
