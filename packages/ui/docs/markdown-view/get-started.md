---
title: Get Started
summary: Render Markdown View once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { MarkdownView } from "@sushindustries/ui";

const source = `
# Hello

A paragraph, a [link](/), and a callout:

> [!NOTE]
> Parsed for free - no prop turns this on.
`;

export function Example() {
	return <MarkdownView source={source} />;
}
```

## What you should see

A heading, a paragraph with a styled link, and a bordered note box with its
own icon and label - all from one `source` string, wrapped in a `.prose`
container. Nothing here needs client JavaScript to look right: parsing and
syntax highlighting both run synchronously, so the page is correct on first
paint, before hydration.

## If nothing happens

An unrecognised block comment - one whose name has no matching entry in
`blocks` - is not an error. It renders its inner content as plain prose,
silently, which can look like the block "did nothing" rather than like a
typo in its name.
