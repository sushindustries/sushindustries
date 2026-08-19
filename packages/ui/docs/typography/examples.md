---
title: Examples
summary: Typography in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="typography" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

The eyebrow, heading and lead paragraph that open most sections on this
site, as one unit:

```tsx
import { Heading, Label, Lead, Text } from "@sushindustries/ui";

export function SectionIntro() {
	return (
		<header>
			<Label icon="layers">Components</Label>
			<Heading as="h2">Everything the site is built from</Heading>
			<Lead>
				Every visible element in this library, installable one at a time.
			</Lead>
			<Text tone="dim" size="sm">
				Updated as components graduate out of the app.
			</Text>
		</header>
	);
}
```

## What this example is not

`Heading` here defaults to `as="h2"` with no explicit `size`, so it is
correct only as the section's own top-level title. Nesting a second `header`
like this inside the section would need `as="h3"` to keep the outline
truthful, even though the eyebrow-heading-lead shape stays the same.
