---
title: Examples
summary: Doc Nav in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="doc-nav" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Link, useParams } from "@tanstack/react-router";
import { DocNav, type DocNavSection } from "@sushindustries/ui";

export function ComponentLayout({ sections }: { sections: DocNavSection[] }) {
	const { slug } = useParams({ from: "/components/$slug" });

	return (
		<div className="doc-layout" data-nav="true">
			<DocNav
				sections={sections}
				active={slug}
				renderLink={({ id, className, children, ...rest }) => (
					<Link
						to="/components/$slug"
						params={{ slug: id }}
						className={className}
						{...rest}
					>
						{children}
					</Link>
				)}
			/>
			{/* the element's own tabs and content */}
		</div>
	);
}
```

## What this example is not

Not the whole documentation shell. `sections` still has to be assembled from
somewhere - on this site, from `registry.ts` and the categories it declares -
this example only shows the rail once it already has that data.
