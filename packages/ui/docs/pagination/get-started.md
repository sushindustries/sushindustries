---
title: Get Started
summary: Render Pagination once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Pagination } from "@sushindustries/ui";

export function Example() {
	return (
		<Pagination page={3} pageCount={12} hrefFor={(page) => `?page=${page}`} />
	);
}
```

## What you should see

A row of page links centred under whatever comes above it: a chevron back
(unless page 1), the numbers with an ellipsis where the window skips ahead,
page 3 marked as current, and a chevron forward. Nothing renders at all when
`pageCount` is 1 or fewer - that's correct, not a bug to chase.

## If nothing happens

Check `pageCount` first - one page or fewer is deliberately blank. After
that, `hrefFor` is required and has no default; without a real function the
links have nowhere to go.
