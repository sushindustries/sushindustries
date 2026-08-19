---
title: Examples
summary: Frontmatter in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="frontmatter" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { parseFrontmatter, readList, readString } from "@sushindustries/ui";

export function loadPost(raw: string) {
	const [, frontmatterBlock, body] = raw.split("---");
	const meta = parseFrontmatter(frontmatterBlock);

	return {
		title: readString(meta, "title", "Untitled"),
		tags: readList(meta, "tags"),
		draft: readString(meta, "draft") === "true",
		body: body?.trim() ?? "",
	};
}
```

## What this example is not

Not how the split should be done for real content - `split("---")` breaks on
a post whose body also contains a `---` rule. The site's own catalogue uses
the boundary `@tanstack/markdown` already finds while parsing, rather than
re-finding it with a string split.
