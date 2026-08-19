---
title: Examples
summary: Section in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="section" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Section } from "@sushindustries/ui";

export function ComponentsPage() {
	return (
		<>
			<Section label="Packages" title="What's installable">
				<p>Every visible element on this site is a component in `ui`.</p>
			</Section>
			<Section
				id="conventions"
				label="Conventions"
				title="How a file gets placed"
			>
				<p>Kebab-case filenames, one component per file, flat.</p>
			</Section>
		</>
	);
}
```
