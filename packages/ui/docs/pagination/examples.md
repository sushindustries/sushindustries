---
title: Examples
summary: Pagination in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="pagination" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Pagination } from "@sushindustries/ui";

interface Result {
	id: string;
	title: string;
}

export function SearchResults({
	page,
	pageCount,
	results,
}: {
	page: number;
	pageCount: number;
	results: readonly Result[];
}) {
	return (
		<section className="container section">
			<ul className="flex flex-col gap-3">
				{results.map((result) => (
					<li key={result.id}>{result.title}</li>
				))}
			</ul>
			<div className="mt-8">
				<Pagination
					page={page}
					pageCount={pageCount}
					hrefFor={(page) => `?page=${page}`}
				/>
			</div>
		</section>
	);
}
```

## What this example is not

A drop-in for a client-side router. Without `renderLink`, every page link is
a plain anchor - clicking one is a full navigation, which is correct for a
server-rendered results page but not what you want if this sits inside a
route that manages `page` as router state.
