---
title: Examples
summary: Collapsible in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="collapsible" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Collapsible } from "@sushindustries/ui";

export function ChangelogEntry({ version, details }: { version: string; details: string }) {
	return (
		<article>
			<p>Version {version} shipped with the usual fixes.</p>
			<Collapsible summary="Full changelog">
				<p>{details}</p>
			</Collapsible>
		</article>
	);
}
```

## What this example is not

`Collapsible` sits inside a plain `<article>` here, not a list of
entries each with their own toggle - if the page needed several
changelog entries all independently expandable in a stack, `Accordion`
is the component that gives them the shared border and grouped look.
