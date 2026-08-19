---
title: Get Started
summary: Render Archive once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Archive } from "@sushindustries/ui";

const categories = [{ id: "guides", label: "Guides" }];

const items = [
	{
		id: "getting-started",
		title: "Getting started",
		description: "The first page to read.",
		category: "guides",
		tags: ["setup"],
		dependencies: [],
		href: "/guides/getting-started",
	},
];

export function Example() {
	return (
		<Archive
			categories={categories}
			items={items}
			hrefForCategory={(id) => `/guides?category=${id}`}
			renderLink={({ href, className, children }) => (
				<a href={href} className={className}>
					{children}
				</a>
			)}
		/>
	);
}
```

## What you should see

An "All" chip plus one chip per category, each showing a count, above a
grid of cards. With one item and no `previewSrc`, the card shows its
category label where the preview would sit, then the title, then a
"No dependencies" row - the empty state is rendered on purpose, not left
blank.

## If nothing happens

An empty grid with the chips still visible means the filters matched
nothing - check `active` against a category `id` you actually declared,
not its label. No tag row appearing is not a bug: it only renders when
`hrefForTag` is passed, regardless of whether any item carries tags.
