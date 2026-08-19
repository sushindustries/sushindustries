---
title: Examples
summary: Archive in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="archive" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useSearch } from "@tanstack/react-router";
import { Archive } from "@sushindustries/ui";
import { categories, items } from "./guides.catalogue";

export function GuidesPage() {
	const { category, tag } = useSearch({ from: "/guides" });

	return (
		<main className="container section">
			<Archive
				categories={categories}
				items={items}
				active={category}
				activeTag={tag}
				hrefForCategory={(id) => `/guides?category=${id}`}
				hrefForTag={(value) =>
					value
						? `/guides?category=${category}&tag=${value}`
						: `/guides?category=${category}`
				}
				renderLink={({ href, className, children }) => (
					<a href={href} className={className}>
						{children}
					</a>
				)}
			/>
		</main>
	);
}
```

## What this example is not

The plain-anchor `renderLink` above works, but every click is a full
document load - a typed router's own `Link` replaces it in production,
the way Guides shows. This example also skips pagination: `page`,
`pageSize` and `hrefForPage` are only worth adding once a category holds
more items than fit comfortably on one screen.
