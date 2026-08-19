---
title: Get Started
summary: Render Doc Aside once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { collectHeadings, DocAside } from "@sushindustries/ui";

export function Example({ source }: { source: string }) {
	return <DocAside headings={collectHeadings(source)} />;
}
```

## What you should see

A sticky list of every `h2` in `source`, in order. Scroll the article beside
it and whichever heading you are currently under highlights on its own,
including the last one - which is the one case a naive
`IntersectionObserver` approach gets wrong.

## If nothing happens

With fewer than `minHeadings` (2 by default) headings, `DocAside` renders
nothing at all - that is correct, not broken, a sidebar with one link is
navigation to where the reader already is. Collect `headings` in a route
loader rather than in the component; parsing Markdown for `h2`s inside the
component itself works, but repeats on every render for no reason.
