---
title: Get Started
summary: Render Frontmatter once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { parseFrontmatter, readList, readString } from "@sushindustries/ui";

const raw = `title: "Shipping a changelog"
tags: [release, writing]`;

export function Example() {
	const meta = parseFrontmatter(raw);

	return (
		<dl>
			<dt>title</dt>
			<dd>{readString(meta, "title")}</dd>
			<dt>tags</dt>
			<dd>{readList(meta, "tags").join(", ")}</dd>
		</dl>
	);
}
```

## What you should see

There is nothing to look at - this is a parser, not a component. What you
should see is `title` reading "Shipping a changelog" and `tags` reading
"release, writing": quoted strings lose their quotes, and `[a, b]` becomes a
real array, both without a YAML library anywhere in the dependency tree.

## If nothing happens

A key with no value, or a line with no `:` at all, is silently skipped rather
than thrown - `parseFrontmatter` never errors on malformed input, it just
omits what it could not read. If a value comes back empty, check the raw
block does not still have its `---` fences on it: this function expects the
frontmatter content only, not the delimiters around it.
