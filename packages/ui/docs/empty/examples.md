---
title: Examples
summary: Empty in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="empty" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Button, Empty } from "@sushindustries/ui";

export function SearchResults({ query, results }: {
	query: string;
	results: readonly { id: string; title: string }[];
}) {
	if (results.length === 0) {
		return (
			<Empty title={`Nothing for "${query}"`} icon="search">
				Try a shorter word, or check the spelling.
			</Empty>
		);
	}

	return (
		<ul className="flex col gap-2">
			{results.map((r) => (
				<li key={r.id}>{r.title}</li>
			))}
		</ul>
	);
}
```

## What this example is not

Not a loading state. This only covers "the search finished and found
nothing" - a request still in flight is `Spinner`'s job, and conflating the
two shows "nothing here" for a fraction of a second on every search.
