---
title: Examples
summary: Badge in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="badge" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Badge, Card } from "@sushindustries/ui";

export function ComponentSummary({ name, tone }: { name: string; tone: string }) {
	return (
		<Card title={name}>
			<Badge tone={tone}>{tone}</Badge>
		</Card>
	);
}
```

## What this example is not

`tone` is passed straight through from data here, not chosen for
contrast against the card behind it - the badge always uses the same
five tones regardless of what card or background it sits on, so there is
no per-page palette decision to make.
