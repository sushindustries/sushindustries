---
title: Examples
summary: Doc Aside in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="doc-aside" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { collectHeadings, DocAside } from "@sushindustries/ui";
import { MarkdownView } from "@sushindustries/ui";

export function DocPage({ source }: { source: string }) {
	const headings = collectHeadings(source);

	return (
		<div className="doc-layout">
			<article>
				<MarkdownView source={source} />
			</article>
			<DocAside headings={headings} />
		</div>
	);
}
```

## What this example is not

Not a single parse. `collectHeadings` parses `source` a second time,
separately from `MarkdownView`'s own render - deliberately synchronous and
server-side, so the cost lands once in the cached HTML rather than on every
client render.
