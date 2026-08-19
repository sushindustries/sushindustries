---
title: Examples
summary: Avatar in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="avatar" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Avatar, Card } from "@sushindustries/ui";

export function ReviewCard({ author, tone, quote }: { author: string; tone: string; quote: string }) {
	return (
		<Card title={author} meta="Verified">
			<div className="flex items-center gap-3">
				<Avatar name={author} tone={tone} size={40} />
				<p className="m-0 fg-dim text-sm">{quote}</p>
			</div>
		</Card>
	);
}
```

## What this example is not

`ReviewCard` never sets `src` here, so every avatar renders as initials -
the fallback is a real design choice in this example, not a placeholder
standing in for a missing photo.
