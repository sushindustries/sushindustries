---
title: Examples
summary: Reference in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="reference" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Ref, type ReferenceMap } from "@sushindustries/ui";

const references: ReferenceMap = {
	Pagination: {
		title: "Pagination",
		href: "/components/pagination",
		summary: "Pages as links, first and last always reachable.",
		meta: "@sushindustries/ui",
	},
};

export function ChangelogEntry() {
	return (
		<p>
			<Ref reference={references.Pagination}>Pagination</Ref> now clamps
			nothing, so a stale page number is the caller's problem again.
		</p>
	);
}
```

## What this example is not

The automatic version. `MarkdownView` matches every backtick-quoted mention
against a `references` map on its own; this example builds the same map and
wires one `Ref` by hand, which is what you'd do outside Markdown.
