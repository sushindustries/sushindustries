---
title: Get Started
summary: Render Doc Nav once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { DocNav } from "@sushindustries/ui";

export function Example() {
	return (
		<DocNav
			active="doc-nav"
			sections={[
				{
					id: "docs",
					label: "Docs",
					icon: "book",
					items: [
						{ id: "doc-aside", label: "Doc Aside", href: "/components/doc-aside" },
						{ id: "doc-nav", label: "Doc Nav", href: "/components/doc-nav" },
					],
				},
			]}
			renderLink={({ href, className, children, ...rest }) => (
				<a href={href} className={className} {...rest}>
					{children}
				</a>
			)}
		/>
	);
}
```

## What you should see

A grouped, sticky list of every section and its elements, with "Doc Nav"
marked as the current one - a different colour and `aria-current="page"` on
its link. On a wide screen it is a plain column; narrow the window past
1200px and it folds into a single row that opens on tap.

## If nothing happens

A `sections` array where every section has an empty `items` renders nothing
at all - an empty category is treated as one nobody has filled yet, not a
heading worth showing. `renderLink` is required and does the actual link
rendering; skip it and nothing renders, since this component has no built-in
fallback to a plain anchor the way some of its siblings do.
